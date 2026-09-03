import type { EvidenceClass } from "@/lib/schema";
import type { GraphIndex } from "./indexes";
import type { NodeCategory } from "./types";

export interface FilterState {
  nodeCategories: Set<NodeCategory>;
  /** relationship_type, incluindo "participation" | "actor" | "transaction". */
  relationshipTypes: Set<string>;
  evidenceClasses: Set<EvidenceClass>;
  officialOnly: boolean;
  documentedOnly: boolean;
  /** YYYY-MM-DD: arestas com `since` posterior ficam ocultas (time machine). */
  dateUntil?: string;
  /** Texto de busca: NÃO oculta nós (só alimenta a lista/realce). */
  search: string;
}

export interface VisibleSets {
  nodes: Set<string>;
  edges: Set<string>;
}

export const ALL_NODE_CATEGORIES: NodeCategory[] = [
  "person",
  "company",
  "party",
  "public_body",
  "financial_institution",
  "organization_other",
  "event",
  "public_act",
  "transaction",
];

export const ALL_EVIDENCE_CLASSES: EvidenceClass[] = ["D", "C", "A", "I"];

export const RELATIONSHIP_TYPE_OPTIONS = [
  "personal_social",
  "familial",
  "professional",
  "political",
  "institutional",
  "financial",
  "commercial",
  "corporate",
  "contractual",
  "shared_event",
  "intermediary",
  "communication",
  "investigative_allegation",
  "participation",
  "actor",
  "transaction",
] as const;

export function defaultFilterState(): FilterState {
  return {
    nodeCategories: new Set(ALL_NODE_CATEGORIES),
    relationshipTypes: new Set(RELATIONSHIP_TYPE_OPTIONS),
    evidenceClasses: new Set(ALL_EVIDENCE_CLASSES),
    officialOnly: false,
    documentedOnly: false,
    dateUntil: undefined,
    search: "",
  };
}

/**
 * Aplica o FilterState e devolve os conjuntos visíveis.
 *
 * Regras:
 *  - aresta visível se ambos os extremos têm categoria permitida, o tipo e a
 *    classe de evidência são permitidos, e passa nos modos oficial/documentado
 *    e no limite de data (arestas sem `since` não são cortadas pela data);
 *  - nó visível se a categoria é permitida E (tem ao menos uma aresta visível
 *    OU é isolado no grafo completo e first_seen <= dateUntil quando há data).
 *    Assim, um modo restritivo (ex.: só oficiais) esconde nós cujas relações
 *    foram todas filtradas, em vez de deixar pontos soltos sem explicação.
 */
export function applyFilters(index: GraphIndex, f: FilterState): VisibleSets {
  const nodes = new Set<string>();
  const edges = new Set<string>();
  const hasVisibleEdge = new Set<string>();

  const categoryOk = (id: string) => {
    const n = index.nodeById.get(id);
    return !!n && f.nodeCategories.has(n.category);
  };

  for (const e of index.edgeById.values()) {
    if (!f.relationshipTypes.has(e.relationship_type)) continue;
    if (!f.evidenceClasses.has(e.evidence_class)) continue;
    if (f.officialOnly && !e.official) continue;
    if (f.documentedOnly && !e.documented) continue;
    if (f.dateUntil && e.since && e.since > f.dateUntil) continue;
    if (!categoryOk(e.source) || !categoryOk(e.target)) continue;
    edges.add(e.id);
    hasVisibleEdge.add(e.source);
    hasVisibleEdge.add(e.target);
  }

  for (const n of index.nodeById.values()) {
    if (!f.nodeCategories.has(n.category)) continue;
    if (hasVisibleEdge.has(n.id)) {
      nodes.add(n.id);
      continue;
    }
    const isolated = (index.adjacency.get(n.id)?.length ?? 0) === 0;
    if (!isolated) continue;
    if (f.dateUntil && !(n.first_seen && n.first_seen <= f.dateUntil)) continue;
    nodes.add(n.id);
  }

  return { nodes, edges };
}

/** Verdadeiro se o estado difere do padrão (para exibir "limpar filtros"). */
export function isFilterActive(f: FilterState): boolean {
  return (
    f.officialOnly ||
    f.documentedOnly ||
    !!f.dateUntil ||
    f.nodeCategories.size !== ALL_NODE_CATEGORIES.length ||
    f.relationshipTypes.size !== RELATIONSHIP_TYPE_OPTIONS.length ||
    f.evidenceClasses.size !== ALL_EVIDENCE_CLASSES.length
  );
}
