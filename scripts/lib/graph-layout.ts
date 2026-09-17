/**
 * Layout do grafo calculado no build, determinístico (mesma entrada e seed → mesmas posições).
 *
 * 1. O núcleo (tudo fora da camada probatória) é o que todo visitante vê primeiro, então é
 *    organizado sozinho: comunidades de Louvain dão a posição de partida, cada uma num setor de
 *    um círculo proporcional ao seu tamanho, e o ForceAtlas2 em modo LinLog assenta o desenho,
 *    separando os grupos em vez de deixar os dois hubs puxarem tudo para o centro.
 * 2. Uma passada final afasta os nós do núcleo que ainda se sobrepõem.
 * 3. A camada probatória é posta depois, junto dos vizinhos, sem mover o núcleo: ligar a camada
 *    não desmonta o desenho que o leitor já está vendo.
 */
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import louvain from "graphology-communities-louvain";
import { FA2_LAYOUT_SETTINGS } from "../../src/lib/graph/layout-settings";

/** Meia largura do desenho do núcleo, em unidades do grafo. */
const EXTENT = 320;

export interface LayoutOptions {
  iterations: number;
  seed: number;
  /** Nós da camada probatória: posicionados depois do núcleo, sem movê-lo. */
  isLayer: (id: string) => boolean;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Distância mínima entre centros para dois nós não se sobreporem. */
const minDistance = (a: number, b: number) => (a + b) * 0.6;

/** Recebe um grafo com atributo `size` por nó e grava `x`/`y`. */
export function layoutGraph(g: Graph, opts: LayoutOptions): void {
  if (g.order === 0) return;
  const rand = mulberry32(opts.seed);
  const layerIds = g.nodes().filter((id) => opts.isLayer(id));

  const core =
    layerIds.length === 0
      ? g
      : subgraph(
          g,
          g.nodes().filter((id) => !opts.isLayer(id)),
        );
  if (core.order > 0) {
    seedByCommunity(core, rand);
    forceAtlas2.assign(core, {
      iterations: opts.iterations,
      settings: { ...FA2_LAYOUT_SETTINGS, barnesHutOptimize: core.order > 800 },
    });
    normalize(core);
    removeOverlaps(core);
    if (core !== g) core.forEachNode((id, a) => g.mergeNodeAttributes(id, { x: a.x, y: a.y }));
  }
  if (layerIds.length > 0) placeLayer(g, layerIds, rand);
}

function subgraph(g: Graph, ids: string[]): Graph {
  const keep = new Set(ids);
  const sub = new Graph({ multi: true, type: "mixed" });
  for (const id of ids) sub.addNode(id, { size: g.getNodeAttribute(id, "size") });
  g.forEachEdge((edge, attrs, source, target, _s, _t, undirected) => {
    if (!keep.has(source) || !keep.has(target)) return;
    if (undirected) sub.addUndirectedEdgeWithKey(edge, source, target, attrs);
    else sub.addDirectedEdgeWithKey(edge, source, target, attrs);
  });
  return sub;
}

/** Louvain exige grafo simples e não misto: arestas paralelas viram peso. */
function communities(g: Graph, rand: () => number): Map<string, number> {
  const simple = new Graph({ type: "undirected" });
  g.forEachNode((id) => simple.addNode(id));
  g.forEachEdge((_e, _a, source, target) => {
    if (source === target) return;
    simple.updateUndirectedEdge(source, target, (attr) => ({
      weight: ((attr as { weight?: number }).weight ?? 0) + 1,
    }));
  });
  const result = louvain(simple, { rng: rand, getEdgeWeight: "weight" });
  return new Map(Object.entries(result));
}

/** Cada comunidade num setor do círculo, com ângulo e raio proporcionais ao tamanho. */
function seedByCommunity(g: Graph, rand: () => number) {
  const community = communities(g, rand);
  const members = new Map<number, string[]>();
  g.forEachNode((id) => {
    const c = community.get(id) ?? -1;
    if (!members.has(c)) members.set(c, []);
    members.get(c)!.push(id);
  });
  const groups = [...members.values()].sort(
    (a, b) => b.length - a.length || (a[0] < b[0] ? -1 : 1),
  );
  const radius = 100;
  let angle = 0;
  for (const group of groups) {
    const share = group.length / g.order;
    const mid = angle + share * Math.PI;
    angle += share * 2 * Math.PI;
    const cx = radius * Math.cos(mid);
    const cy = radius * Math.sin(mid);
    const spread = radius * Math.sqrt(share);
    for (const id of group) {
      const r = spread * Math.sqrt(rand());
      const t = rand() * 2 * Math.PI;
      g.mergeNodeAttributes(id, { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
    }
  }
}

/** Leva o desenho a uma escala fixa, independente do equilíbrio do ForceAtlas2. */
function normalize(g: Graph) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  g.forEachNode((_id, a) => {
    minX = Math.min(minX, a.x);
    maxX = Math.max(maxX, a.x);
    minY = Math.min(minY, a.y);
    maxY = Math.max(maxY, a.y);
  });
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = Math.max(maxX - minX, maxY - minY) / 2 || 1;
  g.updateEachNodeAttributes((_id, a) => ({
    ...a,
    x: ((a.x - cx) / half) * EXTENT,
    y: ((a.y - cy) / half) * EXTENT,
  }));
}

/** Grade espacial para achar vizinhos próximos sem comparar todos os pares. */
class SpatialGrid {
  private cells = new Map<number, number[]>();
  constructor(private cell: number) {}
  add(i: number, x: number, y: number) {
    const k = Math.floor(x / this.cell) * 100003 + Math.floor(y / this.cell);
    const list = this.cells.get(k);
    if (list) list.push(i);
    else this.cells.set(k, [i]);
  }
  forNear(x: number, y: number, fn: (i: number) => void) {
    const gx = Math.floor(x / this.cell);
    const gy = Math.floor(y / this.cell);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const i of this.cells.get((gx + dx) * 100003 + gy + dy) ?? []) fn(i);
  }
}

function maxNodeSize(g: Graph) {
  let max = 1;
  g.forEachNode((_id, a) => (max = Math.max(max, a.size as number)));
  return max;
}

/** Relaxamento simples: empurra pares que se sobrepõem até não sobrar nenhum (ou acabar a vez). */
function removeOverlaps(g: Graph, rounds = 50) {
  const pos = g.mapNodes((id, a) => ({ id, x: a.x as number, y: a.y as number, size: a.size }));
  const largest = maxNodeSize(g);
  for (let round = 0; round < rounds; round++) {
    const grid = new SpatialGrid(minDistance(largest, largest));
    pos.forEach((p, i) => grid.add(i, p.x, p.y));
    let moved = false;
    pos.forEach((a, i) => {
      grid.forNear(a.x, a.y, (j) => {
        if (j <= i) return;
        const b = pos[j];
        const min = minDistance(a.size, b.size);
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d >= min) return;
        // Dois nós no mesmo ponto: direção tirada dos índices, para seguir determinístico.
        const ux = d > 1e-6 ? (b.x - a.x) / d : Math.cos(i + j);
        const uy = d > 1e-6 ? (b.y - a.y) / d : Math.sin(i + j);
        const half = (min - d) / 2;
        a.x -= ux * half;
        a.y -= uy * half;
        b.x += ux * half;
        b.y += uy * half;
        moved = true;
      });
    });
    if (!moved) break;
  }
  for (const p of pos) g.mergeNodeAttributes(p.id, { x: p.x, y: p.y });
}

/**
 * Camada probatória, em ondas a partir do núcleo: cada nó vai para junto dos vizinhos já
 * posicionados, num girassol (raio ∝ √k, ângulo áureo) em torno do ponto médio deles, e avança
 * no girassol enquanto a posição encostar em nó já posto — não há sobreposição por construção.
 * Sem ForceAtlas2: com o núcleo fixo, a repulsão espalharia a camada para longe e encolheria o
 * núcleo na tela.
 */
function placeLayer(g: Graph, layerIds: string[], rand: () => number) {
  const inLayer = new Set(layerIds);
  const largest = maxNodeSize(g);
  const grid = new SpatialGrid(minDistance(largest, largest));
  const placed: { x: number; y: number; size: number }[] = [];
  const isPlaced = new Set<string>();
  const put = (id: string, x: number, y: number) => {
    g.mergeNodeAttributes(id, { x, y });
    grid.add(placed.length, x, y);
    placed.push({ x, y, size: g.getNodeAttribute(id, "size") });
    isPlaced.add(id);
  };
  const free = (x: number, y: number, size: number) => {
    let ok = true;
    grid.forNear(x, y, (i) => {
      const p = placed[i];
      if (Math.hypot(p.x - x, p.y - y) < minDistance(p.size, size)) ok = false;
    });
    return ok;
  };
  g.forEachNode((id, a) => {
    if (!inLayer.has(id)) put(id, a.x, a.y);
  });

  const spacing = 4;
  const flowers = new Map<string, { x: number; y: number; k: number; phase: number }>();
  const plant = (id: string, key: string, cx: number, cy: number, firstK = 0) => {
    let flower = flowers.get(key);
    if (!flower) {
      flower = { x: cx, y: cy, k: firstK, phase: rand() * 2 * Math.PI };
      flowers.set(key, flower);
    }
    const size = g.getNodeAttribute(id, "size") as number;
    for (let tries = 0; ; tries++) {
      const r = spacing * Math.sqrt(flower.k + 1.5);
      const t = flower.phase + flower.k * 2.399963;
      flower.k++;
      const x = flower.x + r * Math.cos(t);
      const y = flower.y + r * Math.sin(t);
      if (free(x, y, size) || tries > 5000) return put(id, x, y);
    }
  };

  let pending = layerIds;
  while (pending.length > 0) {
    const wave: [string, string[]][] = [];
    const next: string[] = [];
    for (const id of pending) {
      const anchors = g.neighbors(id).filter((n) => isPlaced.has(n));
      if (anchors.length === 0) next.push(id);
      else wave.push([id, anchors.sort()]);
    }
    if (wave.length === 0) {
      // Componente só de camada, sem âncora no núcleo: um nó dele vai para um girassol comum,
      // por fora do núcleo, e o resto do componente cresce em volta dele nas ondas seguintes.
      const [first, ...rest] = next;
      plant(first, "", 0, 0, Math.ceil((EXTENT * 1.1) / spacing) ** 2);
      pending = rest;
      continue;
    }
    for (const [id, anchors] of wave) {
      let x = 0;
      let y = 0;
      for (const n of anchors) {
        x += g.getNodeAttribute(n, "x");
        y += g.getNodeAttribute(n, "y");
      }
      plant(id, anchors.join("|"), x / anchors.length, y / anchors.length);
    }
    pending = next;
  }
}
