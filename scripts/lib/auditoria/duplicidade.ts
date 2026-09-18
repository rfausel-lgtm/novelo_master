import type { Corpus } from "../../../src/lib/schema";
import { novoAchado, type Achado } from "./tipos";

/**
 * Duplicidade provável.
 *
 * O lint já pega duas formas: rótulo idêntico depois de normalizar (erro) e tokens de um nome
 * contidos no outro (aviso). Ele próprio documenta o que essas duas regras NÃO pegam — e é isso
 * que esta conferência cobre:
 *
 *  1. Nome quase igual por ERRO DE DIGITAÇÃO. "Vorcaro" e "Vorcato" não têm rótulo idêntico nem
 *     tokens contidos; separa-os uma letra.
 *  2. A MESMA URL em duas fontes com ids diferentes. Acontece quando duas sessões capturam a mesma
 *     reportagem em lotes distintos, e nada no acervo reclama.
 *  3. O MESMO DOCUMENTO duas vezes, pela url ou pelo sha256.
 *  4. Relação repetida SEM data. O lint compara `start_date`, então o par que não tem data nenhuma
 *     escapa — e é justamente o caso em que a duplicata é mais fácil de criar.
 */

const RUIDO_ROTULO = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "ltda",
  "sa",
  "eireli",
  "me",
  "epp",
  "cia",
]);

/** Mesma normalização do lint: sem acento, sem caixa, sem pontuação. */
export function normalizarRotulo(rotulo: string): string {
  return rotulo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(rotulo: string): string[] {
  return normalizarRotulo(rotulo)
    .split(" ")
    .filter((t) => t && !RUIDO_ROTULO.has(t));
}

/** Distância de edição com duas linhas: o acervo compara centenas de milhares de pares. */
export function distanciaEdicao(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  let atual = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    atual[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(atual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo);
    }
    [anterior, atual] = [atual, anterior];
  }
  return anterior[b.length];
}

/**
 * "Quase idêntico" é comparação PALAVRA A PALAVRA, e não distância sobre o rótulo inteiro.
 *
 * Nenhuma escala global separa os casos. O lint já mostrou que proporção não serve ("Antonio
 * Freixo" e "Antônio Carlos Freixo Júnior" batem 0,70 sendo a mesma pessoa); e distância absoluta
 * sobre o rótulo inteiro também não, porque "Pessoa A" e "Pessoa B" estão a uma letra de distância
 * sendo duas pessoas — a letra que muda ali é justamente o que as distingue.
 *
 * O que caracteriza o erro de digitação é UMA palavra trocada por uma quase igual, com as demais
 * idênticas: "Daniel Vorcaro" / "Daniel Vorcato". Daí a regra: mesma quantidade de palavras, todas
 * iguais menos uma, e essa uma com pelo menos cinco letras — abaixo disso a palavra é inicial ou
 * partícula, e uma letra a mais ou a menos muda quem é ("José Silva" e "João Silva").
 */
const LETRAS_MINIMAS_NA_PALAVRA = 5;

export function palavraTrocada(
  a: string[],
  b: string[],
): { de: string; para: string; distancia: number } | undefined {
  if (a.length !== b.length || a.length === 0) return undefined;
  const sobraA = [...a];
  const sobraB = [...b];
  for (const token of [...sobraA]) {
    const i = sobraB.indexOf(token);
    if (i >= 0) {
      sobraB.splice(i, 1);
      sobraA.splice(sobraA.indexOf(token), 1);
    }
  }
  if (sobraA.length !== 1 || sobraB.length !== 1) return undefined;
  const [de, para] = [sobraA[0], sobraB[0]];
  if (de.length < LETRAS_MINIMAS_NA_PALAVRA || para.length < LETRAS_MINIMAS_NA_PALAVRA)
    return undefined;
  const distancia = distanciaEdicao(de, para);
  const tolerancia = Math.max(de.length, para.length) >= 10 ? 2 : 1;
  return distancia <= tolerancia ? { de, para, distancia } : undefined;
}

/**
 * URL comparável: sem fragmento, sem rastreador de campanha, sem `www.`, sem barra final.
 * Duas capturas da mesma reportagem costumam diferir só nisso.
 */
export function normalizarUrl(url: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url.trim().toLowerCase();
  }
  u.hash = "";
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  u.protocol = "https:";
  const parametros = [...u.searchParams.entries()]
    .filter(([k]) => !/^(utm_|fbclid$|gclid$|igshid$|ref$|_ga$)/i.test(k))
    .sort(([a], [b]) => a.localeCompare(b));
  u.search = "";
  for (const [k, v] of parametros) u.searchParams.append(k, v);
  const caminho = u.pathname.replace(/\/+$/, "");
  return `${u.protocol}//${u.hostname}${caminho}${u.search}`;
}

function agrupar<T>(itens: T[], chave: (item: T) => string | undefined): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of itens) {
    const k = chave(item);
    if (!k) continue;
    mapa.set(k, [...(mapa.get(k) ?? []), item]);
  }
  return mapa;
}

export function verificarDuplicidade(corpus: Corpus): Achado[] {
  const achados: Achado[] = [];

  /* ---- fontes com a mesma URL ---- */
  for (const campo of ["url", "archive_url"] as const) {
    for (const [normalizada, fontes] of agrupar(corpus.sources, (s) =>
      s[campo] ? normalizarUrl(s[campo] as string) : undefined,
    )) {
      if (fontes.length < 2) continue;
      const ids = fontes.map((s) => s.id).sort();
      for (const id of ids.slice(1)) {
        achados.push(
          novoAchado({
            categoria: "duplicidade",
            gravidade: "media",
            arquivo: `data/sources/${id}.yaml`,
            registro: id,
            mensagem:
              `${campo} idêntica à de "${ids[0]}" (${normalizada}): a mesma página capturada duas vezes ` +
              "conta como duas fontes independentes onde só existe uma",
          }),
        );
      }
    }
  }

  /* ---- documentos repetidos ---- */
  for (const [campo, rotulo] of [
    ["url", "url"],
    ["sha256", "sha256"],
  ] as const) {
    for (const [valor, docs] of agrupar(corpus.documents, (d) => {
      const v = d[campo];
      if (!v) return undefined;
      return campo === "url" ? normalizarUrl(v) : v;
    })) {
      if (docs.length < 2) continue;
      const ids = docs.map((d) => d.id).sort();
      for (const id of ids.slice(1)) {
        achados.push(
          novoAchado({
            categoria: "duplicidade",
            gravidade: "media",
            arquivo: `data/documents/${id}.yaml`,
            registro: id,
            mensagem: `${rotulo} idêntico ao de "${ids[0]}" (${valor}): é o mesmo documento registrado duas vezes?`,
          }),
        );
      }
    }
  }

  /* ---- nomes quase idênticos ---- */
  const entidades = [
    ...corpus.people.map((p) => ({ ...p, pasta: "people" })),
    ...corpus.organizations.map((o) => ({ ...o, pasta: "organizations" })),
  ].map((e) => ({
    id: e.id,
    pasta: e.pasta,
    distintos: new Set(e.distinct_from),
    rotulos: [e.name, ...e.aliases].map((r) => ({
      original: r,
      norm: normalizarRotulo(r),
      tokens: tokens(r),
    })),
  }));

  for (let i = 0; i < entidades.length; i++) {
    for (let j = i + 1; j < entidades.length; j++) {
      const a = entidades[i];
      const b = entidades[j];
      if (a.distintos.has(b.id) || b.distintos.has(a.id)) continue;

      let melhor: { par: string; distancia: number } | undefined;
      for (const ra of a.rotulos) {
        for (const rb of b.rotulos) {
          /* Já é erro ou aviso do lint: rótulo idêntico, ou tokens de um contidos no outro. */
          if (ra.norm === rb.norm) continue;
          if (ra.tokens.length >= 2 && rb.tokens.length >= 2) {
            const [curto, longo] =
              ra.tokens.length <= rb.tokens.length
                ? [ra.tokens, rb.tokens]
                : [rb.tokens, ra.tokens];
            if (curto.every((t) => longo.includes(t))) continue;
          }
          const trocada = palavraTrocada(ra.tokens, rb.tokens);
          if (trocada && (!melhor || trocada.distancia < melhor.distancia)) {
            melhor = { par: `"${ra.original}" / "${rb.original}"`, distancia: trocada.distancia };
          }
        }
      }
      if (melhor) {
        achados.push(
          novoAchado({
            categoria: "duplicidade",
            gravidade: "media",
            arquivo: `data/${a.pasta}/${a.id}.yaml`,
            registro: a.id,
            mensagem:
              `nome quase idêntico ao de "${b.id}" (${melhor.par}, ${melhor.distancia} letra(s) de diferença): ` +
              `erro de digitação ou duplicata? Se forem registros distintos, declare distinct_from: [${b.id}]`,
          }),
        );
      }
    }
  }

  /* ---- relações repetidas sem data ---- */
  const porAssinatura = agrupar(corpus.relationships, (r) =>
    r.start_date || r.end_date
      ? undefined
      : [r.from_id, r.to_id].sort().join("|") + "|" + r.relationship_type,
  );
  for (const [, lista] of porAssinatura) {
    if (lista.length < 2) continue;
    const ids = lista.map((r) => r.id).sort();
    for (const id of ids.slice(1)) {
      achados.push(
        novoAchado({
          categoria: "duplicidade",
          gravidade: "media",
          arquivo: `data/relationships/${id}.yaml`,
          registro: id,
          mensagem:
            `mesmo par, mesmo tipo e nenhuma data, como "${ids[0]}": o lint compara start_date e não vê ` +
            "este caso. É o mesmo fato registrado duas vezes ou faltam as datas que os distinguem?",
        }),
      );
    }
  }

  return achados;
}
