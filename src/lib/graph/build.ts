/**
 * GraphPayload → graphology MultiGraph (mixed) com os atributos que o Sigma
 * consome (x, y, size, label, color, type) mais os metadados usados pelos
 * reducers. O grafo é construído uma vez por dataset; hover/seleção/filtros
 * são aplicados por reducers, sem mutação.
 */
import Graph from "graphology";
import type { EvidenceClass, RelationshipFamily } from "@/lib/schema";
import type { GraphIndex } from "./indexes";
import { EDGE_ALPHA, EDGE_ALPHA_ACTIVE, EVIDENCE_EDGE_SIZE, edgeTypeFor, withAlpha, type Palette } from "./style";
import type { NodeCategory } from "./types";

export interface SigmaNodeAttributes {
  x: number;
  y: number;
  size: number;
  label: string;
  color: string;
  type: "circle";
  category: NodeCategory;
  kind: string;
  degree: number;
  first_seen?: string;
  [key: string]: unknown;
}

export interface SigmaEdgeAttributes {
  size: number;
  color: string;
  /** Cor plena (sem alfa) da família. */
  baseColor: string;
  /** Cor de realce (alfa alto), pré-calculada para os reducers. */
  activeColor: string;
  type: string;
  family: RelationshipFamily;
  evidence_class: EvidenceClass;
  since?: string;
  label?: string;
  [key: string]: unknown;
}

export type NoveloGraph = Graph<SigmaNodeAttributes, SigmaEdgeAttributes>;

export function buildSigmaGraph(index: GraphIndex, palette: Palette): NoveloGraph {
  const g: NoveloGraph = new Graph({ multi: true, type: "mixed", allowSelfLoops: false });

  for (const n of index.nodeById.values()) {
    g.addNode(n.id, {
      x: n.x,
      y: n.y,
      size: n.size,
      label: n.label,
      color: palette.node[n.category] ?? palette.fg,
      type: "circle",
      category: n.category,
      kind: n.kind,
      degree: n.degree,
      first_seen: n.first_seen,
    });
  }

  for (const e of index.edgeById.values()) {
    if (e.source === e.target) continue;
    const baseColor = palette.family[e.family] ?? palette.fg3;
    const attrs: SigmaEdgeAttributes = {
      size: EVIDENCE_EDGE_SIZE[e.evidence_class],
      color: withAlpha(baseColor, EDGE_ALPHA),
      baseColor,
      activeColor: withAlpha(baseColor, EDGE_ALPHA_ACTIVE),
      type: edgeTypeFor(e.evidence_class, e.directed),
      family: e.family,
      evidence_class: e.evidence_class,
      since: e.since,
      label: e.label,
    };
    if (e.directed) g.addDirectedEdgeWithKey(e.id, e.source, e.target, attrs);
    else g.addUndirectedEdgeWithKey(e.id, e.source, e.target, attrs);
  }

  return g;
}
