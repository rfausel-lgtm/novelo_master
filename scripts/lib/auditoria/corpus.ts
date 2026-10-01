import type { Corpus } from "../../../src/lib/schema";

/** Pasta em `data/` de cada coleção do corpus. */
export const PASTA_DA_COLECAO = {
  people: "people",
  organizations: "organizations",
  events: "events",
  relationships: "relationships",
  claims: "claims",
  sources: "sources",
  documents: "documents",
  public_acts: "public-acts",
  transactions: "transactions",
  evidence: "evidence",
  sequences: "sequences",
  revisions: "revisions",
} as const satisfies Record<string, string>;

export type ChaveColecao = keyof typeof PASTA_DA_COLECAO;

export interface RegistroDoAcervo {
  chave: ChaveColecao;
  pasta: string;
  id: string;
  arquivo: string;
  registro: Record<string, unknown>;
}

/** Percorre todo o corpus, coleção a coleção, em ordem estável. */
export function* percorrerCorpus(corpus: Corpus): Generator<RegistroDoAcervo> {
  for (const chave of Object.keys(PASTA_DA_COLECAO) as ChaveColecao[]) {
    const pasta = PASTA_DA_COLECAO[chave];
    const lista = (corpus[chave] ?? []) as { id: string }[];
    for (const registro of lista) {
      yield {
        chave,
        pasta,
        id: registro.id,
        arquivo: `data/${pasta}/${registro.id}.yaml`,
        registro: registro as unknown as Record<string, unknown>,
      };
    }
  }
}

/**
 * Todos os ids que um registro cita, por qualquer campo `*_id` ou `*_ids`, em qualquer
 * profundidade (`cited_position[].source_ids`, `positions[].organization_id`, `place.source_ids`…).
 *
 * Preferi a varredura genérica à lista de campos escrita à mão: campo novo no schema passa a ser
 * coberto sem ninguém lembrar de atualizar a auditoria, e o custo de um campo que não é id é zero
 * (o id inexistente já é erro do lint, não desta camada).
 */
export function idsCitados(valor: unknown, destino = new Set<string>()): Set<string> {
  if (Array.isArray(valor)) {
    for (const item of valor) idsCitados(item, destino);
    return destino;
  }
  if (!valor || typeof valor !== "object") return destino;
  for (const [chave, v] of Object.entries(valor as Record<string, unknown>)) {
    if (chave.endsWith("_id") && typeof v === "string") {
      destino.add(v);
      continue;
    }
    if (chave.endsWith("_ids") && Array.isArray(v)) {
      for (const item of v) if (typeof item === "string") destino.add(item);
      continue;
    }
    if (v && typeof v === "object") idsCitados(v, destino);
  }
  return destino;
}
