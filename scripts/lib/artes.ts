import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import {
  ARQUIVO_MANIFESTO,
  LARGURA_MAXIMA,
  NOME_CANONICO,
  lerManifestoDeCards,
  lerWebp,
  ArteInvalida,
} from "../../src/lib/social";

/** Fonte de verdade dos ids: `data/revisions/`, onde o id é o nome do arquivo (188/188 conferidos). */
export const DIR_REVISOES = path.join(process.cwd(), "data", "revisions");
export const DIR_ARTES = path.join(process.cwd(), "public", "social");

export const idsDeRevisao = (): string[] =>
  fs
    .readdirSync(DIR_REVISOES)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => path.basename(f, ".yaml"));

/**
 * Resolve o alvo a partir de um número de lote ou de um id completo.
 *
 * Nunca infere nem aproxima: id desconhecido é erro, e número com mais de uma revisão é erro que
 * lista as candidatas. Número de lote não identifica revisão neste acervo — 83, 84, 85 e 86 têm duas
 * cada, e 75b/77b/83b/85b só casam por id.
 */
export function resolverRevisao(alvo: string): string {
  const ids = idsDeRevisao();
  if (ids.includes(alvo)) return alvo;
  if (alvo.startsWith("rev-")) {
    throw new Error(`revisão inexistente: ${alvo}\nNenhum arquivo data/revisions/${alvo}.yaml.`);
  }
  if (!/^\d+$/.test(alvo)) {
    throw new Error(
      `alvo inválido: ${alvo}\nUse o número do lote (ex.: 165) ou o Revision.id completo.`,
    );
  }
  // Comparação literal, não regex: o lote 75 não pode capturar o 75b, e montar um RegExp a partir
  // de argumento de linha de comando é injeção de expressão regular mesmo com o alvo já validado.
  const candidatos = ids.filter(
    (id) => id.includes(`-lote-${alvo}-`) || id.endsWith(`-lote-${alvo}`),
  );
  if (candidatos.length === 1) return candidatos[0];
  if (candidatos.length === 0) {
    throw new Error(`nenhuma revisão para o lote ${alvo}.`);
  }
  throw new Error(
    `o lote ${alvo} tem ${candidatos.length} revisões. Passe o Revision.id completo:\n` +
      candidatos.map((id) => `  ${id}`).join("\n"),
  );
}

export const nomeCanonico = (revisionId: string): string => `${revisionId}.webp`;

/**
 * Manifesto dos cards: quais artes foram GERADAS do próprio acervo, e não ilustradas por IA.
 *
 * Existe por causa da legenda. "Ilustração gerada por IA" é verdade sobre a cena que o Codex pinta e
 * é falsa sobre um card, que só compõe o título que o acervo já aprovou — e legenda falsa num site
 * cujo assunto é procedência não é detalhe. Os dois arquivos são `<Revision.id>.webp` e ficam na
 * mesma pasta de propósito (o contrato de nome único não muda); o manifesto é o que os distingue.
 *
 * A leitura mora em src/lib/social.ts, com o resto do acesso à pasta; aqui fica só a gravação, que
 * é coisa de script. Ordenado e com quebra de linha final: o manifesto entra em diff a cada lote.
 */
export function gravarManifestoDeCards(ids: ReadonlySet<string>): void {
  fs.mkdirSync(DIR_ARTES, { recursive: true });
  fs.writeFileSync(
    path.join(DIR_ARTES, ARQUIVO_MANIFESTO),
    `${JSON.stringify({ cards: [...ids].sort() }, null, 2)}\n`,
    "utf8",
  );
}

export { ARQUIVO_MANIFESTO, lerManifestoDeCards };

export type RevisaoPendente = {
  id: string;
  lote: number;
  title: string;
};

/** Extrai apenas lotes numéricos; `75b` não pode ser confundido com o lote 75. */
export function numeroDoLote(revisionId: string): number | null {
  const achado = /-lote-(\d+)(?:-|$)/.exec(revisionId);
  return achado ? Number(achado[1]) : null;
}

/**
 * Parte pura do detector: seleciona revisões novas sem arte canônica.
 *
 * `desdeLote` é obrigatório no chamador para tornar impossível importar o histórico inteiro por
 * acidente. O arquivo canônico já publicado é o estado durável de deduplicação.
 */
export function selecionarIdsPendentes(
  ids: string[],
  artesExistentes: ReadonlySet<string>,
  desdeLote: number,
): { id: string; lote: number }[] {
  if (!Number.isSafeInteger(desdeLote) || desdeLote < 1) {
    throw new Error("desdeLote deve ser um inteiro positivo");
  }
  return ids
    .map((id) => ({ id, lote: numeroDoLote(id) }))
    .filter(
      (item): item is { id: string; lote: number } =>
        item.lote !== null && item.lote >= desdeLote && !artesExistentes.has(nomeCanonico(item.id)),
    )
    .sort((a, b) => a.lote - b.lote || a.id.localeCompare(b.id));
}

/**
 * Arquivos que contam como ARTE CONCLUÍDA para o detector: tudo, menos os cards.
 *
 * A ilustração do Codex prevalece sobre o card (Rafael, 12/09/2026). Se o card contasse como
 * conclusão — como contou na primeira versão —, cobrir 100% das revisões com card faria a automação
 * nunca mais encontrar pendência, e nenhuma ilustração seria gerada de novo. O card é o que o leitor
 * vê enquanto a ilustração não chega; não é o fim da fila.
 */
export function ilustracoesConcluidas(
  arquivos: readonly string[],
  cards: ReadonlySet<string>,
): Set<string> {
  return new Set(arquivos.filter((arquivo) => !cards.has(arquivo.replace(/\.webp$/, ""))));
}

/** Lê o repositório e devolve as revisões pendentes com o título editorial aprovado. */
export function revisoesPendentes(desdeLote: number): RevisaoPendente[] {
  const artes = ilustracoesConcluidas(
    fs.existsSync(DIR_ARTES) ? fs.readdirSync(DIR_ARTES) : [],
    lerManifestoDeCards(),
  );
  return selecionarIdsPendentes(idsDeRevisao(), artes, desdeLote).map(({ id, lote }) => {
    const documento = parse(fs.readFileSync(path.join(DIR_REVISOES, `${id}.yaml`), "utf8")) as {
      id?: unknown;
      title?: unknown;
    };
    if (documento.id !== id || typeof documento.title !== "string" || !documento.title.trim()) {
      throw new Error(`${id}: revisão sem id/título editorial coerente`);
    }
    return { id, lote, title: documento.title };
  });
}

/** Validações que independem de navegador. Devolve a lista de problemas, vazia quando conforme. */
export function conferirPasta(): string[] {
  const problemas: string[] = [];
  if (!fs.existsSync(DIR_ARTES)) return problemas; // ausência de arte é válida
  const ids = new Set(idsDeRevisao());

  const cards = lerManifestoDeCards();
  for (const id of cards) {
    if (!ids.has(id)) problemas.push(`${ARQUIVO_MANIFESTO}: ${id} não é uma revisão existente`);
    else if (!fs.existsSync(path.join(DIR_ARTES, nomeCanonico(id)))) {
      problemas.push(`${ARQUIVO_MANIFESTO}: ${id} listado como card, mas não há arquivo`);
    }
  }

  for (const arquivo of fs.readdirSync(DIR_ARTES).sort()) {
    if (arquivo === ARQUIVO_MANIFESTO) continue;
    const achado = NOME_CANONICO.exec(arquivo);
    if (!achado) {
      problemas.push(`${arquivo}: fora do contrato. O único nome válido é <Revision.id>.webp`);
      continue;
    }
    if (!ids.has(achado[1])) {
      problemas.push(`${arquivo}: arte órfã, não há data/revisions/${achado[1]}.yaml`);
      continue;
    }
    try {
      const { width, height, animado } = lerWebp(fs.readFileSync(path.join(DIR_ARTES, arquivo)));
      if (animado) problemas.push(`${arquivo}: WebP animado não é publicável`);
      if (width > LARGURA_MAXIMA) {
        problemas.push(`${arquivo}: ${width}x${height}, acima do limite de ${LARGURA_MAXIMA} px`);
      }
    } catch (e) {
      const motivo = e instanceof ArteInvalida ? e.message : String(e);
      problemas.push(`${arquivo}: ${motivo}`);
    }
  }
  return problemas;
}
