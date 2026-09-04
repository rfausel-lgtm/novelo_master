import { z } from "zod";
import {
  IdSchema,
  PartialDateSchema,
  DatePrecisionSchema,
  EvidenceClassSchema,
  FactStatusSchema,
  ReviewTrailSchema,
  CitedPositionSchema,
  PhotoSchema,
  PlaceSchema,
  ConfidenceSchema,
} from "./common";

/* ------------------------------------------------------------------ */
/* Fontes e documentos                                                 */
/* ------------------------------------------------------------------ */

/**
 * Tipos de fonte. Os prefixados com `official_` e `corporate_registry`
 * são considerados FONTES PRIMÁRIAS OFICIAIS (modo "somente fontes oficiais").
 */
export const SourceTypeSchema = z.enum([
  "official_court", // STF, STJ, TRF, JF, TJ
  "official_police", // Polícia Federal
  "official_prosecutor", // PGR, MPF, MP
  "official_legislative", // Câmara, Senado
  "official_regulator", // Banco Central, CVM, TCU, CGU
  "official_gazette", // Diário Oficial da União / estaduais
  "official_government", // Planalto, ministérios, governos estaduais
  "corporate_registry", // Juntas comerciais, Receita (CNPJ), cartórios
  "official_other",
  "press", // veículos jornalísticos reconhecidos
  "wire", // agências de notícias
  "academic",
  "encyclopedic", // Wikipedia e similares: apenas como pista/índice
  "self_published", // material publicado pela própria pessoa/empresa
  "social_media",
  "blog",
  "other",
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

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

export const SourceSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("source"),
    title: z.string().min(1),
    publisher: z.string().min(1),
    author: z.string().optional(),
    publication_date: PartialDateSchema.optional(),
    retrieved_at: PartialDateSchema,
    url: z.string().url(),
    archive_url: z.string().url().optional(),
    source_type: SourceTypeSchema,
    language: z.string().default("pt-BR"),
    summary: z.string().optional(),
    notes: z.string().optional(),
    /** Preenchido pelo Source Verification Agent. */
    verification: z
      .object({
        checked_at: PartialDateSchema,
        checked_by: z.string(),
        url_reachable: z.boolean(),
        content_matches_summary: z.boolean(),
        notes: z.string().optional(),
      })
      .optional(),
  })
  .merge(ReviewTrailSchema);
export type Source = z.infer<typeof SourceSchema>;

export const DocumentTypeSchema = z.enum([
  "judicial_decision",
  "judicial_filing", // petições, denúncias, representações
  "official_report", // relatórios PF, BC, TCU, CGU
  "forensic_extract", // mensagens/metadados extraídos pericialmente
  "contract",
  "corporate_record", // atos societários, contratos sociais, atas
  "gazette_entry",
  "legislative_act", // leis, emendas, projetos, pareceres
  "administrative_act", // resoluções, portarias, decisões administrativas
  "regulatory_record", // atos do BC/CVM
  "letter",
  "public_statement", // notas oficiais, comunicados
  "testimony", // depoimentos, oitivas
  "press_article",
  "other",
]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DocumentSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("document"),
    title: z.string().min(1),
    doc_type: DocumentTypeSchema,
    date: PartialDateSchema.optional(),
    date_precision: DatePrecisionSchema.optional(),
    /** Emissor: id de entidade quando existir, senão texto livre. */
    issuer_id: IdSchema.optional(),
    issuer: z.string().optional(),
    /** Número do processo/protocolo/ofício quando houver. */
    reference: z.string().optional(),
    url: z.string().url().optional(),
    /** Fonte(s) por meio da(s) qual(is) o documento foi obtido/acessado. */
    source_ids: z.array(IdSchema).default([]),
    /** Caminho relativo em raw/ quando o arquivo (ou sua descrição) estiver no repositório. */
    raw_path: z.string().optional(),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    summary: z.string().min(1),
    excerpt: z.string().optional(),
    is_official: z.boolean().default(false),
    related_entity_ids: z.array(IdSchema).default([]),
    tags: z.array(z.string()).default([]),
  })
  .merge(ReviewTrailSchema);
export type Document = z.infer<typeof DocumentSchema>;

/**
 * Evidência: liga UMA proposição concreta a documento(s)/fonte(s),
 * com classificação D/C/A/I. Relações, eventos e claims apontam para cá.
 */
export const EvidenceSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("evidence"),
    classification: EvidenceClassSchema,
    /** A proposição que esta evidência sustenta, em uma frase factual. */
    proposition: z.string().min(1),
    document_ids: z.array(IdSchema).default([]),
    source_ids: z.array(IdSchema).default([]),
    /** Trecho literal (curto) ou localização (página, parágrafo). */
    excerpt: z.string().optional(),
    locator: z.string().optional(),
    /** Para classificação A: quem fez a alegação. */
    attributed_to_id: IdSchema.optional(),
    attributed_to: z.string().optional(),
    /** Para classificação I: raciocínio explícito e o que NÃO se conclui. */
    inference_basis: z.string().optional(),
    date: PartialDateSchema.optional(),
    notes: z.string().optional(),
  })
  .merge(ReviewTrailSchema);
export type Evidence = z.infer<typeof EvidenceSchema>;

/* ------------------------------------------------------------------ */
/* Agentes: pessoas e organizações                                     */
/* ------------------------------------------------------------------ */

export const PersonCategorySchema = z.enum([
  "banker",
  "businessperson",
  "politician",
  "judge",
  "prosecutor",
  "police",
  "lawyer",
  "public_official",
  "executive",
  "journalist",
  "family",
  "other",
]);
export type PersonCategory = z.infer<typeof PersonCategorySchema>;

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

export const PositionSchema = z.object({
  title: z.string().min(1),
  organization_id: IdSchema.optional(),
  organization: z.string().optional(),
  start_date: PartialDateSchema.optional(),
  end_date: PartialDateSchema.optional(),
  source_ids: z.array(IdSchema).default([]),
});

export const PersonSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("person"),
    name: z.string().min(1),
    full_name: z.string().optional(),
    aliases: z.array(z.string()).default([]),
    category: PersonCategorySchema,
    /** Cargo/função principal no período relevante. */
    role: z.string().min(1),
    /** Cargos e vínculos institucionais com datas. */
    positions: z.array(PositionSchema).default([]),
    summary: z.string().min(1),
    /** Uma frase factual e neutra: "Por que está no Novelo?" */
    why_in_novelo: z.string().min(1),
    photo: PhotoSchema.optional(),
    /** Contraditório. Lista vazia é exibida como "posição não localizada". */
    cited_position: z.array(CitedPositionSchema).default([]),
    /** Lacunas ainda não esclarecidas. */
    open_questions: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    source_ids: z.array(IdSchema).default([]),
    external_ids: z
      .object({
        wikidata: z.string().optional(),
        wikipedia_pt: z.string().url().optional(),
      })
      .optional(),
  })
  .merge(ReviewTrailSchema);
export type Person = z.infer<typeof PersonSchema>;

export const OrgTypeSchema = z.enum([
  "company",
  "financial_institution",
  "public_body",
  "court",
  "party",
  "fund",
  "law_firm",
  "media",
  "association",
  "other",
]);
export type OrgType = z.infer<typeof OrgTypeSchema>;

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

export const OrganizationSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("organization"),
    name: z.string().min(1),
    full_name: z.string().optional(),
    aliases: z.array(z.string()).default([]),
    org_type: OrgTypeSchema,
    cnpj: z
      .string()
      .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
      .optional(),
    jurisdiction: z.string().optional(),
    summary: z.string().min(1),
    why_in_novelo: z.string().min(1),
    photo: PhotoSchema.optional(),
    cited_position: z.array(CitedPositionSchema).default([]),
    open_questions: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    source_ids: z.array(IdSchema).default([]),
    /** Sede ou endereço institucional, quando for fato do caso. Nunca residência. */
    place: PlaceSchema.optional(),
    external_ids: z
      .object({
        wikidata: z.string().optional(),
        wikipedia_pt: z.string().url().optional(),
      })
      .optional(),
  })
  .merge(ReviewTrailSchema);
export type Organization = z.infer<typeof OrganizationSchema>;

/* ------------------------------------------------------------------ */
/* Eventos, atos públicos e transações                                 */
/* ------------------------------------------------------------------ */

export const EventTypeSchema = z.enum([
  "meeting",
  "communication",
  "travel",
  "payment",
  "transaction",
  "corporate_act",
  "public_act",
  "judicial_decision",
  "investigation_step", // operação, busca, prisão, oitiva
  "regulatory_act",
  "publication",
  "statement",
  "appointment", // nomeação, posse
  "social_event",
  "other",
]);
export type EventType = z.infer<typeof EventTypeSchema>;

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

export const EventSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("event"),
    title: z.string().min(1),
    event_type: EventTypeSchema,
    date: PartialDateSchema,
    date_precision: DatePrecisionSchema.default("day"),
    end_date: PartialDateSchema.optional(),
    location: z.string().optional(),
    /** Lugar geolocalizado, quando o lugar é ele próprio um fato do caso. */
    place: PlaceSchema.optional(),
    /** Entidades (pessoas/organizações) que participaram ou são objeto do evento. */
    participant_ids: z.array(IdSchema).default([]),
    description: z.string().min(1),
    evidence_class: EvidenceClassSchema,
    status: FactStatusSchema.default("unverified"),
    evidence_ids: z.array(IdSchema).default([]),
    source_ids: z.array(IdSchema).default([]),
    document_ids: z.array(IdSchema).default([]),
    public_act_ids: z.array(IdSchema).default([]),
    cited_position: z.array(CitedPositionSchema).default([]),
    tags: z.array(z.string()).default([]),
  })
  .merge(ReviewTrailSchema);
export type Event = z.infer<typeof EventSchema>;

export const PublicActTypeSchema = z.enum([
  "legislative",
  "judicial",
  "administrative",
  "regulatory",
  "executive",
]);
export type PublicActType = z.infer<typeof PublicActTypeSchema>;

export const PUBLIC_ACT_TYPE_LABEL: Record<PublicActType, string> = {
  legislative: "Legislativo",
  judicial: "Judicial",
  administrative: "Administrativo",
  regulatory: "Regulatório",
  executive: "Executivo",
};

export const PublicActSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("public_act"),
    title: z.string().min(1),
    act_type: PublicActTypeSchema,
    date: PartialDateSchema,
    date_precision: DatePrecisionSchema.default("day"),
    issuer_id: IdSchema.optional(),
    issuer: z.string().optional(),
    /** Agentes que praticaram/assinaram/relataram o ato. */
    actor_ids: z.array(IdSchema).default([]),
    /** Entidades afetadas/beneficiadas segundo os documentos. */
    affected_ids: z.array(IdSchema).default([]),
    description: z.string().min(1),
    reference: z.string().optional(),
    url: z.string().url().optional(),
    evidence_class: EvidenceClassSchema,
    status: FactStatusSchema.default("unverified"),
    evidence_ids: z.array(IdSchema).default([]),
    source_ids: z.array(IdSchema).default([]),
    document_ids: z.array(IdSchema).default([]),
    tags: z.array(z.string()).default([]),
  })
  .merge(ReviewTrailSchema);
export type PublicAct = z.infer<typeof PublicActSchema>;

export const TransactionTypeSchema = z.enum([
  "payment",
  "loan",
  "acquisition",
  "investment",
  "donation",
  "fee",
  "guarantee",
  "asset_sale",
  "other",
]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

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

export const TransactionSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("transaction"),
    title: z.string().min(1),
    transaction_type: TransactionTypeSchema,
    from_id: IdSchema,
    to_id: IdSchema,
    amount: z.number().nonnegative().optional(),
    currency: z.string().default("BRL"),
    amount_text: z.string().optional(),
    date: PartialDateSchema,
    date_precision: DatePrecisionSchema.default("day"),
    description: z.string().min(1),
    evidence_class: EvidenceClassSchema,
    status: FactStatusSchema.default("unverified"),
    evidence_ids: z.array(IdSchema).default([]),
    source_ids: z.array(IdSchema).default([]),
    document_ids: z.array(IdSchema).default([]),
    event_ids: z.array(IdSchema).default([]),
    cited_position: z.array(CitedPositionSchema).default([]),
    tags: z.array(z.string()).default([]),
  })
  .merge(ReviewTrailSchema);
export type Transaction = z.infer<typeof TransactionSchema>;

/* ------------------------------------------------------------------ */
/* Relações e claims                                                   */
/* ------------------------------------------------------------------ */

/** Tipos de relação. A cor da aresta deriva da FAMÍLIA. */
export const RelationshipTypeSchema = z.enum([
  "personal_social",
  "familial",
  "professional",
  "political",
  "institutional",
  "financial",
  "commercial",
  "corporate", // societário
  "contractual",
  "shared_event",
  "intermediary",
  "communication",
  "investigative_allegation",
]);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

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

export const RelationshipFamilySchema = z.enum([
  "institutional",
  "financial",
  "political",
  "social",
  "professional",
  "corporate",
  "allegation",
]);
export type RelationshipFamily = z.infer<typeof RelationshipFamilySchema>;

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

export const RelationshipSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("relationship"),
    from_id: IdSchema,
    to_id: IdSchema,
    relationship_type: RelationshipTypeSchema,
    directed: z.boolean().default(false),
    /** Rótulo curto da aresta (ex.: "reunião documentada", "sócio", "advogado de"). */
    label: z.string().min(1),
    start_date: PartialDateSchema.optional(),
    end_date: PartialDateSchema.optional(),
    /** Intermediário, quando a relação passa por terceiro. */
    via_id: IdSchema.optional(),
    /** "Por que estes nós estão conectados?" com resposta factual. */
    description: z.string().min(1),
    evidence_class: EvidenceClassSchema,
    confidence: ConfidenceSchema,
    status: FactStatusSchema.default("unverified"),
    event_ids: z.array(IdSchema).default([]),
    evidence_ids: z.array(IdSchema).default([]),
    source_ids: z.array(IdSchema).default([]),
    document_ids: z.array(IdSchema).default([]),
    transaction_ids: z.array(IdSchema).default([]),
    /** Posição dos envolvidos sobre esta relação específica. */
    cited_position: z.array(CitedPositionSchema).default([]),
    tags: z.array(z.string()).default([]),
  })
  .merge(ReviewTrailSchema);
export type Relationship = z.infer<typeof RelationshipSchema>;

/**
 * Claim: proposição sob análise (hipótese, alegação ou conclusão investigativa),
 * com status explícito. Claims nunca viram fato por si; apontam para evidências.
 */
export const ClaimSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("claim"),
    statement: z.string().min(1),
    classification: EvidenceClassSchema,
    status: FactStatusSchema,
    /** Quem sustenta o claim (autoridade, veículo, pessoa). */
    claimant_id: IdSchema.optional(),
    claimant: z.string().optional(),
    date: PartialDateSchema.optional(),
    related_entity_ids: z.array(IdSchema).default([]),
    event_ids: z.array(IdSchema).default([]),
    evidence_ids: z.array(IdSchema).default([]),
    source_ids: z.array(IdSchema).default([]),
    /** O que os documentos NÃO permitem afirmar. */
    limits: z.string().optional(),
    counter_position: z.array(CitedPositionSchema).default([]),
    /** Registro do Adversarial Reviewer. */
    adversarial_review: z
      .object({
        reviewed_at: PartialDateSchema,
        reviewer: z.string(),
        attempted_refutation: z.string(),
        outcome: z.enum(["stands", "weakened", "disputed", "refuted"]),
      })
      .optional(),
    tags: z.array(z.string()).default([]),
  })
  .merge(ReviewTrailSchema);
export type Claim = z.infer<typeof ClaimSchema>;

/** Sequências temporais para /coincidencias. */
export const TemporalSequenceSchema = z
  .object({
    id: IdSchema,
    kind: z.literal("temporal_sequence"),
    title: z.string().min(1),
    /** Ordem cronológica de eventos e/ou atos públicos. */
    step_ids: z.array(IdSchema).min(2),
    temporal_proximity: z.enum(["high", "medium", "low"]),
    documentary_link: z.enum(["present", "absent", "partial"]),
    causality_proven: z.boolean(),
    description: z.string().min(1),
    /** Explicitar o que não se conclui. */
    limits: z.string().min(1),
    source_ids: z.array(IdSchema).default([]),
    evidence_ids: z.array(IdSchema).default([]),
    tags: z.array(z.string()).default([]),
  })
  .merge(ReviewTrailSchema);
export type TemporalSequence = z.infer<typeof TemporalSequenceSchema>;

/** Registro de atualização editorial para /atualizacoes. */
export const RevisionSchema = z.object({
  id: IdSchema,
  kind: z.literal("revision"),
  date: PartialDateSchema,
  summary: z.string().min(1),
  added: z
    .object({
      people: z.number().int().nonnegative().default(0),
      organizations: z.number().int().nonnegative().default(0),
      events: z.number().int().nonnegative().default(0),
      documents: z.number().int().nonnegative().default(0),
      relationships: z.number().int().nonnegative().default(0),
      sources: z.number().int().nonnegative().default(0),
      evidence: z.number().int().nonnegative().default(0),
    })
    .default({
      people: 0,
      organizations: 0,
      events: 0,
      documents: 0,
      relationships: 0,
      sources: 0,
      evidence: 0,
    }),
  updated_relationships: z.number().int().nonnegative().default(0),
  corrections: z.array(z.string()).default([]),
  author: z.string().optional(),
});
export type Revision = z.infer<typeof RevisionSchema>;
