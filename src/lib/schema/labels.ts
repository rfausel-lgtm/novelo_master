/*
 * Rótulos de exibição, sem zod em runtime: componentes client importam daqui para não levar o
 * validador ao navegador. Os tipos vêm dos schemas só como tipo. Não importe valor de ./common,
 * ./entities ou ./index neste arquivo.
 */
import type { CitedPosition, EvidenceClass, FactStatus } from "./common";
import type {
  EventType,
  OrgType,
  PersonCategory,
  PublicActType,
  RelationshipFamily,
  RelationshipType,
  SourceType,
  TransactionType,
} from "./entities";

export const EVIDENCE_CLASS_LABEL: Record<EvidenceClass, string> = {
  D: "Documental direto",
  C: "Corroborado",
  A: "Alegação",
  I: "Inferência",
};

export const FACT_STATUS_LABEL: Record<FactStatus, string> = {
  verified: "Verificado",
  disputed: "Disputado",
  unverified: "Não verificado",
  refuted: "Refutado",
};

export const PERSON_CATEGORY_LABEL: Record<PersonCategory, string> = {
  banker: "Banqueiro",
  businessperson: "Empresário",
  politician: "Político",
  judge: "Magistrado",
  prosecutor: "Membro do Ministério Público",
  police: "Policial",
  lawyer: "Advogado",
  public_official: "Servidor / agente público",
  executive: "Executivo",
  journalist: "Jornalista",
  family: "Familiar",
  other: "Outro",
};

export const ORG_TYPE_LABEL: Record<OrgType, string> = {
  company: "Empresa",
  financial_institution: "Instituição financeira",
  public_body: "Órgão público",
  court: "Tribunal",
  party: "Partido",
  fund: "Fundo",
  law_firm: "Escritório de advocacia",
  media: "Veículo de mídia",
  association: "Associação",
  other: "Outra",
};

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  meeting: "Reunião / encontro",
  communication: "Comunicação",
  travel: "Viagem",
  payment: "Pagamento",
  transaction: "Transação",
  corporate_act: "Ato societário",
  public_act: "Ato público",
  judicial_decision: "Decisão judicial",
  investigation_step: "Ato de investigação",
  regulatory_act: "Ato regulatório",
  publication: "Publicação",
  statement: "Declaração",
  appointment: "Nomeação / posse",
  social_event: "Evento social",
  other: "Outro",
};

export const PUBLIC_ACT_TYPE_LABEL: Record<PublicActType, string> = {
  legislative: "Legislativo",
  judicial: "Judicial",
  administrative: "Administrativo",
  regulatory: "Regulatório",
  executive: "Executivo",
};

export const RELATIONSHIP_TYPE_LABEL: Record<RelationshipType, string> = {
  personal_social: "Pessoal / social",
  familial: "Familiar",
  professional: "Profissional",
  political: "Político",
  institutional: "Institucional",
  financial: "Financeiro",
  commercial: "Comercial",
  corporate: "Societário",
  contractual: "Contratual",
  shared_event: "Evento compartilhado",
  intermediary: "Intermediação",
  communication: "Comunicação",
  investigative_allegation: "Alegação investigativa",
};

export const RELATIONSHIP_FAMILY: Record<RelationshipType, RelationshipFamily> = {
  personal_social: "social",
  familial: "social",
  professional: "professional",
  political: "political",
  institutional: "institutional",
  financial: "financial",
  commercial: "financial",
  corporate: "corporate",
  contractual: "financial",
  shared_event: "professional",
  intermediary: "professional",
  communication: "social",
  investigative_allegation: "allegation",
};

export const RELATIONSHIP_FAMILY_LABEL: Record<RelationshipFamily, string> = {
  institutional: "Institucional",
  financial: "Financeiro / comercial",
  political: "Político",
  social: "Pessoal / social",
  professional: "Profissional",
  corporate: "Societário",
  allegation: "Alegação investigativa",
};

export const OFFICIAL_SOURCE_TYPES: ReadonlySet<SourceType> = new Set<SourceType>([
  "official_court",
  "official_police",
  "official_prosecutor",
  "official_legislative",
  "official_regulator",
  "official_gazette",
  "official_government",
  "corporate_registry",
  "official_other",
]);

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  official_court: "Tribunal (oficial)",
  official_police: "Polícia Federal (oficial)",
  official_prosecutor: "Ministério Público (oficial)",
  official_legislative: "Legislativo (oficial)",
  official_regulator: "Órgão regulador (oficial)",
  official_gazette: "Diário Oficial",
  official_government: "Governo (oficial)",
  corporate_registry: "Registro societário",
  official_other: "Outra fonte oficial",
  press: "Imprensa",
  wire: "Agência de notícias",
  academic: "Acadêmica",
  encyclopedic: "Enciclopédica",
  self_published: "Publicação própria",
  social_media: "Rede social",
  blog: "Blog",
  other: "Outra",
};

export const CITED_POSITION_LABEL: Record<CitedPosition["kind"], string> = {
  denial: "Negativa",
  clarification: "Esclarecimento",
  public_note: "Nota pública",
  version: "Versão apresentada",
  alternative_explanation: "Explicação alternativa",
  no_response: "Sem resposta",
  not_located: "Posição não localizada",
};

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  payment: "Pagamento",
  loan: "Empréstimo",
  acquisition: "Aquisição",
  investment: "Investimento",
  donation: "Doação",
  fee: "Honorário / taxa",
  guarantee: "Garantia",
  asset_sale: "Venda de ativo",
  other: "Outra",
};
