import fs from "node:fs";
import path from "node:path";
import { LARGURA_MAXIMA, NOME_CANONICO, lerWebp, ArteInvalida } from "../../src/lib/social";

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
    throw new Error(`alvo inválido: ${alvo}\nUse o número do lote (ex.: 165) ou o Revision.id completo.`);
  }
  const candidatos = ids.filter((id) => new RegExp(`-lote-${alvo}(?:-|$)`).test(id));
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

/** Validações que independem de navegador. Devolve a lista de problemas, vazia quando conforme. */
export function conferirPasta(): string[] {
  const problemas: string[] = [];
  if (!fs.existsSync(DIR_ARTES)) return problemas; // ausência de arte é válida
  const ids = new Set(idsDeRevisao());

  for (const arquivo of fs.readdirSync(DIR_ARTES).sort()) {
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
