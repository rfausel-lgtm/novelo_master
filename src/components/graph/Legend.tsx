"use client";

import {
  RELATIONSHIP_FAMILY_LABEL,
  EVIDENCE_CLASS_LABEL,
  type EvidenceClass,
  type RelationshipFamily,
} from "@/lib/schema";
import { EVIDENCE_SHAPE, FAMILY_VAR, NODE_VAR } from "@/lib/graph/style";
import { NODE_CATEGORY_LABEL, type NodeCategory } from "@/lib/graph/types";

const FAMILIES: RelationshipFamily[] = [
  "institutional",
  "financial",
  "political",
  "social",
  "professional",
  "corporate",
  "allegation",
];
const CLASSES: EvidenceClass[] = ["D", "C", "A", "I"];
const CATEGORIES: NodeCategory[] = [
  "person",
  "company",
  "financial_institution",
  "public_body",
  "party",
  "event",
  "public_act",
  "document",
  "source",
  "claim",
  "evidence",
];

function Stroke({ cls }: { cls: EvidenceClass }) {
  const shape = EVIDENCE_SHAPE[cls];
  const dash = shape === "dashed" ? "6 4" : shape === "dotted" ? "1.5 3.5" : undefined;
  const width = shape === "solidShort" ? 1 : shape === "solid" ? 2.2 : 1.6;
  return (
    <svg width="56" height="10" aria-hidden="true" className="shrink-0">
      <line
        x1="2"
        y1="5"
        x2="54"
        y2="5"
        stroke="#aab3bf"
        strokeWidth={width}
        strokeDasharray={dash}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Legenda: cor = natureza da relação; forma = força da evidência; nós por categoria. */
export function Legend({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3 text-xs" aria-label="Legenda do grafo">
      <p className="text-fg-2">
        <span className="text-fg font-medium">Cor</span> = natureza da relação ·{" "}
        <span className="text-fg font-medium">Forma</span> = força da evidência
      </p>
      <div>
        <h4 className="text-fg-3 mb-1 text-[10.5px] font-semibold tracking-[0.14em] uppercase">
          Natureza da relação
        </h4>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
          {FAMILIES.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-0.5 w-6 rounded"
                style={{ background: `var(${FAMILY_VAR[f]})` }}
              />
              <span className="text-fg-2">{RELATIONSHIP_FAMILY_LABEL[f]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-fg-3 mb-1 text-[10.5px] font-semibold tracking-[0.14em] uppercase">
          Força da evidência
        </h4>
        <ul className="space-y-1">
          {CLASSES.map((c) => (
            <li key={c} className="flex items-center gap-2">
              <Stroke cls={c} />
              <span className="text-fg-2">
                <span className="text-fg font-mono">{c}</span> {EVIDENCE_CLASS_LABEL[c]}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {!compact && (
        <div>
          <h4 className="text-fg-3 mb-1 text-[10.5px] font-semibold tracking-[0.14em] uppercase">
            Nós
          </h4>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
            {CATEGORIES.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 shrink-0 ${c === "event" || c === "public_act" ? "rotate-45 rounded-sm" : "rounded-full"}`}
                  style={{ background: `var(${NODE_VAR[c]})` }}
                />
                <span className="text-fg-2">{NODE_CATEGORY_LABEL[c]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-fg-3">
        {/* A paleta não tem vermelho: a frase citava uma cor que não existe na tela. */}
        Nenhuma cor significa ilícito. A cor indica a natureza da relação; a força da evidência está
        na forma da linha. Alegações (A) e inferências (I) não são fatos verificados, e estar no mapa
        não implica irregularidade.
      </p>
    </div>
  );
}
