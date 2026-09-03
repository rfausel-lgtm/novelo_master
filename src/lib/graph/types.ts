import type {
  EvidenceClass,
  FactStatus,
  RelationshipFamily,
  RelationshipType,
  OrgType,
  PersonCategory,
  EventType,
  PublicActType,
} from "@/lib/schema";

/** Categorias de nó expostas nos filtros do grafo. */
export type NodeCategory =
  | "person"
  | "company"
  | "party"
  | "public_body"
  | "financial_institution"
  | "organization_other"
  | "event"
  | "public_act"
  | "transaction"
  | "document"
  | "source"
  | "claim"
  | "evidence";

export const NODE_CATEGORY_LABEL: Record<NodeCategory, string> = {
  person: "Pessoa",
  company: "Empresa",
  party: "Partido",
  public_body: "Órgão público",
  financial_institution: "Instituição financeira",
  organization_other: "Outra organização",
  event: "Evento",
  public_act: "Ato público",
  transaction: "Transação",
  document: "Documento",
  source: "Fonte",
  claim: "Claim",
  evidence: "Evidência",
};

export interface GraphNode {
  id: string;
  kind:
    | "person"
    | "organization"
    | "event"
    | "public_act"
    | "transaction"
    | "document"
    | "source"
    | "claim"
    | "evidence";
  category: NodeCategory;
  label: string;
  /** Subtipo original (categoria de pessoa, org_type, event_type...). */
  subtype: PersonCategory | OrgType | EventType | PublicActType | string;
  role?: string;
  why?: string;
  /** Data (parcial) associada ao nó; eventos/atos têm data própria, agentes usam a primeira aparição. */
  date?: string;
  /** Primeira data em que o nó aparece em alguma relação/evento (time machine). */
  first_seen?: string;
  /** Contadores para o card. */
  degree: number;
  event_count: number;
  official_source_count: number;
  evidence_count: number;
  has_photo: boolean;
  /** Posição pré-calculada (ForceAtlas2 no build). */
  x: number;
  y: number;
  /** Tamanho sugerido (escala do grau). */
  size: number;
  href: string;
}

export type EdgeKind = "relationship" | "participation" | "actor" | "transaction" | "evidence_link";

export interface GraphSourceInfo {
  title: string;
  publisher: string;
  official: boolean;
}

export interface GraphPositionInfo {
  by?: string;
  by_id?: string;
  kind: string;
  summary: string;
  date?: string;
  source_ids: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  /** Tipo de relação (para relationship) ou tipo derivado. */
  relationship_type:
    | RelationshipType
    | "participation"
    | "actor"
    | "transaction"
    | "supports"
    | "documents"
    | "originates_from"
    | "mentions";
  family: RelationshipFamily;
  label: string;
  evidence_class: EvidenceClass;
  status: FactStatus;
  confidence: number;
  directed: boolean;
  start_date?: string;
  end_date?: string;
  /** Data a partir da qual a aresta existe (time machine): start_date ou data do evento. */
  since?: string;
  /** Verdadeiro se houver ao menos uma fonte primária oficial. */
  official: boolean;
  /** Verdadeiro para D/C (fatos documentados/corroborados). */
  documented: boolean;
  source_ids: string[];
  evidence_ids: string[];
  event_ids: string[];
  description: string;
  via_id?: string;
  document_ids?: string[];
  cited_positions?: GraphPositionInfo[];
}

export interface GraphStats {
  people: number;
  organizations: number;
  events: number;
  public_acts: number;
  transactions: number;
  documents: number;
  sources: number;
  official_sources: number;
  evidence: number;
  relationships: number;
  claims: number;
  nodes: number;
  edges: number;
  min_date?: string;
  max_date?: string;
}

/** Contrato de public/data/graph.json consumido pelo cliente. */
export interface GraphPayload {
  version: 1;
  built_at: string;
  stats: GraphStats;
  nodes: GraphNode[];
  edges: GraphEdge[];
  source_index: Record<string, GraphSourceInfo>;
}
