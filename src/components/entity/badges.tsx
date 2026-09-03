import type { EvidenceClass, FactStatus, Source } from "@/lib/schema";
import { EVIDENCE_CLASS_LABEL, FACT_STATUS_LABEL, OFFICIAL_SOURCE_TYPES, SOURCE_TYPE_LABEL } from "@/lib/schema";

const EVIDENCE_COLOR: Record<EvidenceClass, string> = { D: "var(--ev-d)", C: "var(--ev-c)", A: "var(--ev-a)", I: "var(--ev-i)" };

export const EVIDENCE_EXPLANATION: Record<EvidenceClass, string> = {
  D: "Documental direto: consta de documento primário verificável (decisão, relatório oficial, contrato, registro).",
  C: "Corroborado: confirmado por múltiplas fontes independentes, sem documento primário no corpus.",
  A: "Alegação: declaração atribuída a terceiro. Não equivale a fato comprovado.",
  I: "Inferência: interpretação analítica a partir de fatos conhecidos. Não é prova.",
};

export function EvidenceBadge({ cls, explain = false }: { cls: EvidenceClass; explain?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium"
        style={{ borderColor: EVIDENCE_COLOR[cls], color: EVIDENCE_COLOR[cls] }}
        title={EVIDENCE_EXPLANATION[cls]}
      >
        <span className="font-mono">{cls}</span>
        <span>{EVIDENCE_CLASS_LABEL[cls]}</span>
      </span>
      {explain && <span className="text-fg-3 text-xs">{EVIDENCE_EXPLANATION[cls]}</span>}
    </span>
  );
}

export function StatusBadge({ status }: { status: FactStatus }) {
  const tone =
    status === "verified"
      ? "border-fg-2/50 text-fg-2"
      : status === "disputed"
        ? "border-rel-political/70 text-rel-political"
        : status === "refuted"
          ? "border-fg-3 text-fg-3 line-through"
          : "border-fg-3 text-fg-3";
  return <span className={`inline-flex rounded border px-1.5 py-0.5 text-xs ${tone}`}>{FACT_STATUS_LABEL[status]}</span>;
}

export function OfficialBadge({ source }: { source: Pick<Source, "source_type"> }) {
  const official = OFFICIAL_SOURCE_TYPES.has(source.source_type);
  return (
    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[11px] ${official ? "border-rel-financial/70 text-rel-financial" : "border-border text-fg-3"}`}>
      {official ? "Fonte oficial" : SOURCE_TYPE_LABEL[source.source_type]}
    </span>
  );
}

export function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="bg-bg-3 text-fg-2 inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs">
      {color && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}
