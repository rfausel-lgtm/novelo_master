import type { GraphEdge, GraphNode, GraphPayload } from "./types";

/** Entrada de adjacência: aresta incidente e o nó do outro lado. */
export interface Adjacent {
  edge: string;
  other: string;
}

/**
 * Índice imutável derivado do payload, construído uma única vez por dataset.
 * Todas as funções puras (algoritmos, filtros, busca) operam sobre ele.
 */
export interface GraphIndex {
  payload: GraphPayload;
  nodeById: Map<string, GraphNode>;
  edgeById: Map<string, GraphEdge>;
  /** Adjacência NÃO direcionada (todas as arestas incidentes). */
  adjacency: Map<string, Adjacent[]>;
  /** Nós ordenados por grau decrescente (busca/ranking). */
  nodesByDegree: GraphNode[];
}

function minDate(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

export function buildIndex(payload: GraphPayload): GraphIndex {
  const nodeById = new Map<string, GraphNode>();
  const adjacency = new Map<string, Adjacent[]>();
  for (const n of payload.nodes) {
    // cópia rasa: first_seen recebe fallback abaixo sem mutar o payload
    nodeById.set(n.id, { ...n });
    adjacency.set(n.id, []);
  }

  const edgeById = new Map<string, GraphEdge>();
  for (const e of payload.edges) {
    const s = nodeById.get(e.source);
    const t = nodeById.get(e.target);
    if (!s || !t) continue;
    edgeById.set(e.id, e);
    adjacency.get(e.source)!.push({ edge: e.id, other: e.target });
    adjacency.get(e.target)!.push({ edge: e.id, other: e.source });
    if (e.since) {
      s.first_seen = minDate(s.first_seen, e.since);
      t.first_seen = minDate(t.first_seen, e.since);
    }
  }

  // Fallback final: nós com data própria e sem first_seen.
  for (const n of nodeById.values()) {
    if (!n.first_seen && n.date) n.first_seen = n.date;
  }

  const nodesByDegree = [...nodeById.values()].sort((a, b) => b.degree - a.degree);

  return { payload, nodeById, edgeById, adjacency, nodesByDegree };
}

/** Nós vizinhos (1º grau) de um nó, sem repetição. */
export function neighborsOf(index: GraphIndex, id: string): string[] {
  const out = new Set<string>();
  for (const a of index.adjacency.get(id) ?? []) out.add(a.other);
  return [...out];
}
