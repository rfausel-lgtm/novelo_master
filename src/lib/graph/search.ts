import type { GraphIndex } from "./indexes";
import type { GraphNode } from "./types";

/** Faixa Unicode dos diacríticos combinantes (U+0300..U+036F). */
const COMBINING_MARKS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, "g");

/** Normaliza para comparação: minúsculas, sem acentos. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .trim();
}

/**
 * Pontuação difusa simples e previsível (sem dependência):
 *  - prefixo exato de palavra: 100
 *  - substring: 80
 *  - subsequência (letras na ordem): 40 - penalidade por dispersão
 *  Empates são desfeitos pelo grau (nós mais conectados primeiro).
 */
export function fuzzyScore(query: string, text: string): number {
  if (!query) return 0;
  const q = normalize(query);
  const t = normalize(text);
  if (!q || !t) return 0;
  if (t.startsWith(q) || t.split(/\s+/).some((w) => w.startsWith(q))) return 100;
  const idx = t.indexOf(q);
  if (idx >= 0) return 80 - Math.min(20, idx);
  let ti = 0;
  let first = -1;
  let last = -1;
  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi];
    if (c === " ") continue;
    const found = t.indexOf(c, ti);
    if (found < 0) return 0;
    if (first < 0) first = found;
    last = found;
    ti = found + 1;
  }
  const spread = last - first + 1 - q.replace(/ /g, "").length;
  return Math.max(1, 40 - spread);
}

export interface SearchHit {
  node: GraphNode;
  score: number;
}

export function searchNodes(index: GraphIndex, query: string, limit = 12, only?: ReadonlySet<string>): SearchHit[] {
  const q = query.trim();
  if (q.length < 1) return [];
  const hits: SearchHit[] = [];
  for (const node of index.nodesByDegree) {
    if (only && !only.has(node.id)) continue;
    const s = Math.max(fuzzyScore(q, node.label), node.role ? fuzzyScore(q, node.role) - 30 : 0);
    if (s > 0) hits.push({ node, score: s });
  }
  hits.sort((a, b) => b.score - a.score || b.node.degree - a.node.degree);
  return hits.slice(0, limit);
}
