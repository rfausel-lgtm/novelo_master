/**
 * Fixture pequena e legível para os testes do motor do grafo.
 *
 *   a —r1(D, oficial, 2020-01-10)— b —r2(C, 2021-03-01)— c
 *   a —r3(A, 2022-06-15)— c                 (atalho alegado)
 *   a, b —part(D, 2019-05-05)→ ev1          (evento compartilhado)
 *   c —act(I, 2023-01-01)→ ato1
 *   d isolado (first_seen 2018-02-01 via date)
 *   e —r4(D, 2024-01-01)— f  (componente separado)
 */
import type { GraphEdge, GraphNode, GraphPayload } from "./types";

function node(
  partial: Partial<GraphNode> & Pick<GraphNode, "id" | "kind" | "category" | "label">,
): GraphNode {
  return {
    subtype: "other",
    degree: 0,
    event_count: 0,
    official_source_count: 0,
    evidence_count: 0,
    has_photo: false,
    x: 0,
    y: 0,
    size: 4,
    href: `/x/${partial.id}`,
    ...partial,
  };
}

function edge(
  partial: Partial<GraphEdge> & Pick<GraphEdge, "id" | "source" | "target" | "evidence_class">,
): GraphEdge {
  const documented = partial.evidence_class === "D" || partial.evidence_class === "C";
  return {
    kind: "relationship",
    relationship_type: "professional",
    family: "professional",
    label: "relação",
    status: "verified",
    confidence: 0.8,
    directed: false,
    official: false,
    documented,
    source_ids: [],
    evidence_ids: [],
    event_ids: [],
    description: "descrição",
    ...partial,
  };
}

export const FIXTURE: GraphPayload = {
  version: 1,
  source_index: {},
  built_at: "2026-01-01T00:00:00.000Z",
  stats: {
    people: 5,
    organizations: 1,
    events: 1,
    public_acts: 1,
    transactions: 0,
    documents: 0,
    sources: 0,
    official_sources: 0,
    evidence: 0,
    relationships: 4,
    claims: 0,
    nodes: 8,
    edges: 7,
    min_date: "2019-05-05",
    max_date: "2024-01-01",
  },
  nodes: [
    node({ id: "a", kind: "person", category: "person", label: "Ana Exemplo", degree: 3 }),
    node({ id: "b", kind: "person", category: "person", label: "Bruno Exemplo", degree: 3 }),
    node({
      id: "c",
      kind: "organization",
      category: "company",
      label: "Companhia Exemplo",
      degree: 3,
    }),
    node({
      id: "d",
      kind: "person",
      category: "person",
      label: "Dora Isolada",
      date: "2018-02-01",
    }),
    node({ id: "e", kind: "person", category: "person", label: "Elias Exemplo", degree: 1 }),
    node({ id: "f", kind: "person", category: "person", label: "Fábio Exemplo", degree: 1 }),
    node({
      id: "ev1",
      kind: "event",
      category: "event",
      label: "Reunião Exemplo",
      date: "2019-05-05",
      degree: 2,
    }),
    node({
      id: "ato1",
      kind: "public_act",
      category: "public_act",
      label: "Ato Exemplo",
      date: "2023-01-01",
      degree: 1,
    }),
  ],
  edges: [
    edge({
      id: "r1",
      source: "a",
      target: "b",
      evidence_class: "D",
      official: true,
      since: "2020-01-10",
      relationship_type: "corporate",
      family: "corporate",
    }),
    edge({ id: "r2", source: "b", target: "c", evidence_class: "C", since: "2021-03-01" }),
    edge({
      id: "r3",
      source: "a",
      target: "c",
      evidence_class: "A",
      since: "2022-06-15",
      relationship_type: "investigative_allegation",
      family: "allegation",
    }),
    edge({
      id: "p1",
      source: "a",
      target: "ev1",
      evidence_class: "D",
      official: true,
      kind: "participation",
      relationship_type: "participation",
      directed: true,
      since: "2019-05-05",
    }),
    edge({
      id: "p2",
      source: "b",
      target: "ev1",
      evidence_class: "D",
      official: true,
      kind: "participation",
      relationship_type: "participation",
      directed: true,
      since: "2019-05-05",
    }),
    edge({
      id: "x1",
      source: "c",
      target: "ato1",
      evidence_class: "I",
      kind: "actor",
      relationship_type: "actor",
      family: "institutional",
      directed: true,
      since: "2023-01-01",
    }),
    edge({
      id: "r4",
      source: "e",
      target: "f",
      evidence_class: "D",
      official: true,
      since: "2024-01-01",
    }),
  ],
};
