/** Reexporta rótulos pt-BR do schema e adiciona os que faltam para as páginas. */
import type { DocumentType } from "@/lib/schema";
export {
  RELATIONSHIP_FAMILY,
  RELATIONSHIP_FAMILY_LABEL,
  RELATIONSHIP_TYPE_LABEL,
  TRANSACTION_TYPE_LABEL,
  EVENT_TYPE_LABEL,
  PUBLIC_ACT_TYPE_LABEL,
  PERSON_CATEGORY_LABEL,
  ORG_TYPE_LABEL,
  SOURCE_TYPE_LABEL,
  EVIDENCE_CLASS_LABEL,
  FACT_STATUS_LABEL,
  CITED_POSITION_LABEL,
} from "@/lib/schema";

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  judicial_decision: "Decisão judicial",
  judicial_filing: "Peça judicial",
  official_report: "Relatório oficial",
  forensic_extract: "Extração pericial",
  contract: "Contrato",
  corporate_record: "Registro societário",
  gazette_entry: "Diário Oficial",
  legislative_act: "Ato legislativo",
  administrative_act: "Ato administrativo",
  regulatory_record: "Registro regulatório",
  letter: "Ofício / carta",
  public_statement: "Comunicação oficial",
  testimony: "Depoimento",
  press_article: "Reportagem",
  other: "Outro",
};

export function DOCUMENT_TYPE_LABEL_SAFE(t: string): string {
  return (DOCUMENT_TYPE_LABEL as Record<string, string>)[t] ?? t;
}
