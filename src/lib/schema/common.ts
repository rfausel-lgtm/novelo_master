import { z } from "zod";

/** Identificadores: slug kebab-case ascii (ex.: daniel-vorcaro, evt-2023-12-26-reuniao). */
export const IdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id deve ser kebab-case ascii (ex.: daniel-vorcaro)");

/** Datas ISO parciais: YYYY, YYYY-MM ou YYYY-MM-DD. */
export const PartialDateSchema = z
  .string()
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "data deve ser YYYY, YYYY-MM ou YYYY-MM-DD");

export const DatePrecisionSchema = z.enum(["day", "month", "year", "approximate"]);

/**
 * Classificação de evidência (METHODOLOGY.md):
 *  D — documental direto
 *  C — corroborado por múltiplas fontes independentes
 *  A — alegação atribuída a terceiro
 *  I — inferência analítica
 */
export const EvidenceClassSchema = z.enum(["D", "C", "A", "I"]);
export type EvidenceClass = z.infer<typeof EvidenceClassSchema>;

export const EVIDENCE_CLASS_LABEL: Record<EvidenceClass, string> = {
  D: "Documental direto",
  C: "Corroborado",
  A: "Alegação",
  I: "Inferência",
};

/** Status factual de um registro após o gauntlet editorial. */
export const FactStatusSchema = z.enum(["verified", "disputed", "unverified", "refuted"]);
export type FactStatus = z.infer<typeof FactStatusSchema>;

export const FACT_STATUS_LABEL: Record<FactStatus, string> = {
  verified: "Verificado",
  disputed: "Disputado",
  unverified: "Não verificado",
  refuted: "Refutado",
};

/** Estado no fluxo editorial. Só `published` entra no build público. */
export const ReviewStatusSchema = z.enum(["draft", "in_review", "published", "retracted"]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const ReviewTrailSchema = z.object({
  review_status: ReviewStatusSchema.default("draft"),
  reviewer: z.string().optional(),
  reviewed_at: PartialDateSchema.optional(),
  created_at: PartialDateSchema,
  updated_at: PartialDateSchema,
});

/** Posição do citado / contraditório. */
export const CitedPositionSchema = z.object({
  date: PartialDateSchema.optional(),
  /** Entidade que se manifestou (pessoa ou organização). */
  by_id: IdSchema.optional(),
  by: z.string().optional(),
  kind: z.enum([
    "denial",
    "clarification",
    "public_note",
    "version",
    "alternative_explanation",
    "no_response",
    "not_located",
  ]),
  summary: z.string().min(1),
  source_ids: z.array(IdSchema).default([]),
});
export type CitedPosition = z.infer<typeof CitedPositionSchema>;

export const CITED_POSITION_LABEL: Record<CitedPosition["kind"], string> = {
  denial: "Negativa",
  clarification: "Esclarecimento",
  public_note: "Nota pública",
  version: "Versão apresentada",
  alternative_explanation: "Explicação alternativa",
  no_response: "Sem resposta",
  not_located: "Posição não localizada",
};

/** Metadados obrigatórios de imagem. */
export const PhotoSchema = z.object({
  path: z.string().min(1),
  source: z.string().min(1),
  author: z.string().min(1),
  license: z.string().min(1),
  original_url: z.string().url(),
  retrieved_at: PartialDateSchema,
  alt: z.string().min(1),
  /*
   * Onde está o rosto na imagem. O avatar é um recorte circular central; numa foto de cobertura a
   * pessoa costuma estar de lado, e o recorte pegaria o vizinho. Ajusta o enquadramento sem alterar
   * o arquivo, que continua sendo o original com a licença que a fonte declara.
   */
  focus: z.enum(["left", "center", "right", "top"]).default("center"),
});
export type Photo = z.infer<typeof PhotoSchema>;

/**
 * Lugar geolocalizado. Só para lugares que são, eles próprios, fato do caso — um imóvel sob
 * investigação, a sede de uma instituição, um prédio público. NUNCA residência de pessoa: a política
 * editorial proíbe endereço residencial, e uma coordenada é forma mais precisa de endereço.
 *
 * Uma coordenada é uma afirmação sobre onde algo fica, e como toda afirmação aqui, precisa de fonte
 * quando a precisão for melhor que o município.
 */
export const PlaceKindSchema = z.enum([
  "property", // terreno, imóvel, fazenda
  "building", // sede, escritório, prédio identificado
  "public_body", // órgão público
  "venue", // hotel, clube, local de evento
  "airport",
  "city",
  "region",
]);
export type PlaceKind = z.infer<typeof PlaceKindSchema>;

export const PLACE_KIND_LABEL: Record<PlaceKind, string> = {
  property: "Imóvel",
  building: "Edificação",
  public_body: "Órgão público",
  venue: "Local de evento",
  airport: "Aeroporto",
  city: "Município",
  region: "Região",
};

export const PlacePrecisionSchema = z.enum(["exact", "approximate", "city"]);
export type PlacePrecision = z.infer<typeof PlacePrecisionSchema>;

export const PLACE_PRECISION_LABEL: Record<PlacePrecision, string> = {
  exact: "coordenada do lugar",
  approximate: "localização aproximada",
  city: "centro do município",
};

export const PlaceSchema = z.object({
  /** Como o lugar é chamado no texto: "Terreno em Jequitibá (MG)". */
  name: z.string().min(1),
  kind: PlaceKindSchema,
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  precision: PlacePrecisionSchema,
  /** O que a coordenada NÃO diz: limites do imóvel, matrícula não localizada etc. */
  note: z.string().optional(),
  source_ids: z.array(IdSchema).default([]),
});
export type Place = z.infer<typeof PlaceSchema>;

export const ConfidenceSchema = z.number().min(0).max(1);
