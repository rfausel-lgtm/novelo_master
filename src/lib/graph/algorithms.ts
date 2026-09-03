/**
 * Algoritmos puros sobre o GraphIndex. Todos aceitam um recorte opcional de
 * visibilidade (nós/arestas permitidos) para respeitar os filtros ativos.
 * A travessia é NÃO direcionada: uma pessoa "chega" a outra por um evento
 * compartilhado, por exemplo, independentemente da seta.
 */
import type { GraphIndex } from "./indexes";

export interface Visibility {
  nodes?: ReadonlySet<string>;
  edges?: ReadonlySet<string>;
}

export interface PathResult {
  nodes: string[];
  /** edges[i] liga nodes[i] a nodes[i+1]. */
  edges: string[];
}

export interface SubgraphSelection {
  nodes: Set<string>;
  edges: Set<string>;
}

function allowedNode(vis: Visibility | undefined, id: string): boolean {
  return !vis?.nodes || vis.nodes.has(id);
}
function allowedEdge(vis: Visibility | undefined, id: string): boolean {
  return !vis?.edges || vis.edges.has(id);
}

/** Caminho mais curto (BFS não direcionado) ou null se desconexos. */
export function shortestPath(
  index: GraphIndex,
  from: string,
  to: string,
  vis?: Visibility,
  maxLen = Infinity,
): PathResult | null {
  if (!index.nodeById.has(from) || !index.nodeById.has(to)) return null;
  if (!allowedNode(vis, from) || !allowedNode(vis, to)) return null;
  if (from === to) return { nodes: [from], edges: [] };

  const parent = new Map<string, { node: string; edge: string }>();
  const depth = new Map<string, number>([[from, 0]]);
  const queue: string[] = [from];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const d = depth.get(cur)!;
    if (d >= maxLen) continue;
    for (const { edge, other } of index.adjacency.get(cur) ?? []) {
      if (depth.has(other) || !allowedEdge(vis, edge) || !allowedNode(vis, other)) continue;
      depth.set(other, d + 1);
      parent.set(other, { node: cur, edge });
      if (other === to) return unwind(parent, from, to);
      queue.push(other);
    }
  }
  return null;
}

function unwind(parent: Map<string, { node: string; edge: string }>, from: string, to: string): PathResult {
  const nodes = [to];
  const edges: string[] = [];
  let cur = to;
  while (cur !== from) {
    const p = parent.get(cur)!;
    edges.push(p.edge);
    nodes.push(p.node);
    cur = p.node;
  }
  return { nodes: nodes.reverse(), edges: edges.reverse() };
}

export interface AlternativePathOptions {
  /** Quantidade máxima de alternativas (além do caminho mais curto). */
  k?: number;
  /** Comprimento máximo em saltos; padrão: menor caminho + 2. */
  maxLen?: number;
  /** Orçamento de expansões da busca para não travar em grafos densos. */
  budget?: number;
}

/**
 * Caminho mais curto + até k caminhos simples alternativos (DFS limitada em
 * profundidade, com orçamento). Alternativas são distintas em sequência de nós.
 */
export function kPaths(
  index: GraphIndex,
  from: string,
  to: string,
  vis?: Visibility,
  opts: AlternativePathOptions = {},
): PathResult[] {
  const best = shortestPath(index, from, to, vis);
  if (!best) return [];
  const k = opts.k ?? 3;
  const maxLen = opts.maxLen ?? best.edges.length + 2;
  let budget = opts.budget ?? 200_000;

  const results: PathResult[] = [best];
  const seen = new Set<string>([best.nodes.join(">")]);
  const found: PathResult[] = [];

  // Distância até o alvo (BFS reverso) para podar ramos sem chance.
  const distToTarget = bfsDistances(index, to, vis, maxLen);

  const pathNodes: string[] = [from];
  const pathEdges: string[] = [];
  const onPath = new Set<string>([from]);

  const dfs = (cur: string): boolean => {
    if (budget-- <= 0) return true; // esgotado
    const len = pathEdges.length;
    if (cur === to) {
      const key = pathNodes.join(">");
      if (!seen.has(key)) {
        seen.add(key);
        found.push({ nodes: [...pathNodes], edges: [...pathEdges] });
      }
      return false;
    }
    if (len >= maxLen) return false;
    for (const { edge, other } of index.adjacency.get(cur) ?? []) {
      if (onPath.has(other) || !allowedEdge(vis, edge) || !allowedNode(vis, other)) continue;
      const rest = distToTarget.get(other);
      if (rest === undefined || len + 1 + rest > maxLen) continue;
      onPath.add(other);
      pathNodes.push(other);
      pathEdges.push(edge);
      const exhausted = dfs(other);
      pathEdges.pop();
      pathNodes.pop();
      onPath.delete(other);
      if (exhausted) return true;
    }
    return false;
  };
  dfs(from);

  found.sort((a, b) => a.edges.length - b.edges.length);
  for (const p of found) {
    if (results.length > k) break;
    results.push(p);
  }
  return results;
}

function bfsDistances(index: GraphIndex, source: string, vis: Visibility | undefined, maxLen: number) {
  const dist = new Map<string, number>([[source, 0]]);
  const queue = [source];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const d = dist.get(cur)!;
    if (d >= maxLen) continue;
    for (const { edge, other } of index.adjacency.get(cur) ?? []) {
      if (dist.has(other) || !allowedEdge(vis, edge) || !allowedNode(vis, other)) continue;
      dist.set(other, d + 1);
      queue.push(other);
    }
  }
  return dist;
}

/** Vizinhança até `depth` saltos (1..3), incluindo o nó raiz e as arestas internas. */
export function neighborhood(index: GraphIndex, root: string, depth: 1 | 2 | 3, vis?: Visibility): SubgraphSelection {
  const nodes = new Set<string>();
  const edges = new Set<string>();
  if (!index.nodeById.has(root)) return { nodes, edges };
  nodes.add(root);
  let frontier = [root];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const cur of frontier) {
      for (const { edge, other } of index.adjacency.get(cur) ?? []) {
        if (!allowedEdge(vis, edge) || !allowedNode(vis, other)) continue;
        edges.add(edge);
        if (!nodes.has(other)) {
          nodes.add(other);
          next.push(other);
        }
      }
    }
    frontier = next;
  }
  // arestas entre nós da última camada
  for (const id of nodes) {
    for (const { edge, other } of index.adjacency.get(id) ?? []) {
      if (nodes.has(other) && allowedEdge(vis, edge)) edges.add(edge);
    }
  }
  return { nodes, edges };
}

/** Nós adjacentes a TODOS os nós informados (excluindo os próprios). */
export function commonNeighbors(index: GraphIndex, ids: string[], vis?: Visibility): string[] {
  if (ids.length === 0) return [];
  const sets = ids.map((id) => {
    const s = new Set<string>();
    for (const { edge, other } of index.adjacency.get(id) ?? []) {
      if (allowedEdge(vis, edge) && allowedNode(vis, other)) s.add(other);
    }
    return s;
  });
  const selection = new Set(ids);
  return [...sets[0]].filter((n) => !selection.has(n) && sets.every((s) => s.has(n)));
}

/** Eventos/atos públicos compartilhados por todos os nós informados. */
export function sharedEvents(index: GraphIndex, ids: string[], vis?: Visibility): string[] {
  return commonNeighbors(index, ids, vis).filter((n) => {
    const kind = index.nodeById.get(n)?.kind;
    return kind === "event" || kind === "public_act";
  });
}

/**
 * Intermediários: nós fora da seleção adjacentes a pelo menos dois nós da
 * seleção (com ≥3 selecionados isso é mais amplo que "vizinhos comuns").
 */
export function intermediaries(index: GraphIndex, ids: string[], vis?: Visibility): string[] {
  const selection = new Set(ids);
  const count = new Map<string, number>();
  for (const id of ids) {
    const seen = new Set<string>();
    for (const { edge, other } of index.adjacency.get(id) ?? []) {
      if (selection.has(other) || seen.has(other)) continue;
      if (!allowedEdge(vis, edge) || !allowedNode(vis, other)) continue;
      seen.add(other);
      count.set(other, (count.get(other) ?? 0) + 1);
    }
  }
  return [...count.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n);
}

/** Subgrafo induzido pela seleção; com `withNeighbors`, inclui o 1º grau. */
export function inducedSubgraph(index: GraphIndex, ids: string[], withNeighbors = false, vis?: Visibility): SubgraphSelection {
  const nodes = new Set(ids.filter((id) => index.nodeById.has(id) && allowedNode(vis, id)));
  if (withNeighbors) {
    for (const id of ids) {
      for (const { edge, other } of index.adjacency.get(id) ?? []) {
        if (allowedEdge(vis, edge) && allowedNode(vis, other)) nodes.add(other);
      }
    }
  }
  const edges = new Set<string>();
  for (const id of nodes) {
    for (const { edge, other } of index.adjacency.get(id) ?? []) {
      if (nodes.has(other) && allowedEdge(vis, edge)) edges.add(edge);
    }
  }
  return { nodes, edges };
}

/** Arestas diretas entre dois nós. */
export function edgesBetween(index: GraphIndex, a: string, b: string): string[] {
  return (index.adjacency.get(a) ?? []).filter((x) => x.other === b).map((x) => x.edge);
}
