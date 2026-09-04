"use client";

import Link from "next/link";
import {
  EVIDENCE_CLASS_LABEL,
  FACT_STATUS_LABEL,
  RELATIONSHIP_FAMILY_LABEL,
  RELATIONSHIP_TYPE_LABEL,
} from "@/lib/schema";
import type { GraphIndex } from "@/lib/graph/indexes";
import type { GraphEdge, GraphPositionInfo, GraphSourceInfo } from "@/lib/graph/types";
import { FAMILY_COLOR_FALLBACK, EVIDENCE_SHAPE_LABEL } from "@/lib/graph/style";
import { formatDatePT } from "@/lib/graph/dates";
import { Chip, EvidenceBadge, PanelShell, SectionHeading } from "./ui";

interface EdgeCardProps {
  index: GraphIndex;
  edge: GraphEdge;
  onClose: () => void;
  onSelectNode: (id: string) => void;
  /** Mapa opcional id → metadados da fonte (rótulos e selo "oficial"). */
  sourceIndex: Record<string, GraphSourceInfo>;
}

export { EVIDENCE_EXPLANATION } from "@/lib/labels";
import { EVIDENCE_EXPLANATION } from "@/lib/labels";

const EDGE_KIND_LABEL: Record<string, string> = {
  participation: "Participação em evento",
  actor: "Atuação em ato público",
  transaction: "Transação",
};

const POSITION_KIND_LABEL: Record<string, string> = {
  denial: "Negativa",
  clarification: "Esclarecimento",
  public_note: "Nota pública",
  version: "Versão apresentada",
  alternative_explanation: "Explicação alternativa",
  no_response: "Sem resposta",
  not_located: "Posição não localizada",
};

function Position({
  position,
  sourceIndex,
}: {
  position: GraphPositionInfo;
  sourceIndex: Record<string, GraphSourceInfo>;
}) {
  return (
    <li className="text-fg-2 text-[13px] leading-relaxed">
      <div>
        <span className="text-fg font-medium">{position.by ?? "Envolvido"}</span>
        <span className="text-fg-3"> · {POSITION_KIND_LABEL[position.kind] ?? position.kind}</span>
        {position.date && <span className="text-fg-3"> · {formatDatePT(position.date)}</span>}
      </div>
      <p>{position.summary}</p>
      {position.source_ids.length > 0 && (
        <div className="mt-0.5 flex flex-wrap gap-x-2">
          {position.source_ids.map((id) => (
            <Link
              key={id}
              href={`/fontes/${id}`}
              className="text-accent text-[11px] hover:underline"
            >
              {sourceIndex[id]?.title ?? id}
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}

export function EdgeCard({ index, edge, onClose, onSelectNode, sourceIndex }: EdgeCardProps) {
  const source = index.nodeById.get(edge.source);
  const target = index.nodeById.get(edge.target);
  const familyColor = FAMILY_COLOR_FALLBACK[edge.family];
  const typeLabel =
    (RELATIONSHIP_TYPE_LABEL as Record<string, string>)[edge.relationship_type] ??
    EDGE_KIND_LABEL[edge.relationship_type] ??
    edge.relationship_type;
  const via = edge.via_id ? index.nodeById.get(edge.via_id) : undefined;

  return (
    <PanelShell
      onClose={onClose}
      labelledBy="edge-card-title"
      title={
        <span className="text-fg-3 text-[10.5px] font-semibold tracking-[0.14em] uppercase">
          Conexão
        </span>
      }
    >
      <h2 id="edge-card-title" className="text-fg mt-3 text-sm leading-snug font-semibold">
        <button type="button" className="hover:underline" onClick={() => onSelectNode(edge.source)}>
          {source?.label ?? edge.source}
        </button>
        <span className="text-fg-3 mx-1.5 font-normal">{edge.directed ? "→" : "—"}</span>
        <button type="button" className="hover:underline" onClick={() => onSelectNode(edge.target)}>
          {target?.label ?? edge.target}
        </button>
      </h2>
      <p className="text-fg-2 mt-1 text-xs">{edge.label}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Chip color={familyColor}>{RELATIONSHIP_FAMILY_LABEL[edge.family]}</Chip>
        <Chip>{typeLabel}</Chip>
        <Chip>{FACT_STATUS_LABEL[edge.status]}</Chip>
        <Chip title="Confiança do revisor no registro desta relação, de 0 a 100%. Não é probabilidade nem medida estatística; a força probatória está na classe de evidência.">confiança {Math.round(edge.confidence * 100)}%</Chip>
        {(edge.start_date || edge.since) && (
          <Chip>
            {formatDatePT(edge.start_date ?? edge.since)}
            {edge.end_date ? ` → ${formatDatePT(edge.end_date)}` : ""}
          </Chip>
        )}
      </div>
      {via && (
        <p className="text-fg-3 mt-1.5 text-xs">
          via{" "}
          <button
            type="button"
            className="text-fg-2 hover:underline"
            onClick={() => onSelectNode(via.id)}
          >
            {via.label}
          </button>
        </p>
      )}

      <SectionHeading>Por que estes nós estão conectados?</SectionHeading>
      <p className="text-fg-2 text-[13px] leading-relaxed">{edge.description}</p>

      <SectionHeading>Fontes</SectionHeading>
      {edge.source_ids.length === 0 ? (
        <p className="text-fg-3 text-xs">Nenhuma fonte vinculada.</p>
      ) : (
        <ul className="space-y-1">
          {edge.source_ids.map((id) => {
            const info = sourceIndex?.[id];
            return (
              <li key={id} className="text-xs">
                <Link href={`/fontes/${id}`} className="text-accent hover:underline">
                  {info?.title ?? id}
                </Link>
                {info?.publisher && <span className="text-fg-3"> · {info.publisher}</span>}
                {info?.official && (
                  <span className="border-ev-d text-ev-d ml-1.5 rounded border px-1 text-[10px]">
                    oficial
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {edge.evidence_ids.length > 0 && (
        <p className="text-fg-3 mt-1.5 text-[11px]">
          {edge.evidence_ids.length}{" "}
          {edge.evidence_ids.length === 1 ? "evidência vinculada" : "evidências vinculadas"}
        </p>
      )}

      <SectionHeading>Força da evidência</SectionHeading>
      <div className="flex items-start gap-2">
        <EvidenceBadge cls={edge.evidence_class} />
      </div>
      <p className="text-fg-2 mt-1.5 text-[13px] leading-relaxed">
        {EVIDENCE_EXPLANATION[edge.evidence_class]}
      </p>
      <p className="text-fg-3 mt-1 text-[11px]">
        No grafo: {EVIDENCE_SHAPE_LABEL[edge.evidence_class]} (
        {EVIDENCE_CLASS_LABEL[edge.evidence_class].toLowerCase()}).
        {edge.official ? " Há fonte primária oficial." : " Sem fonte primária oficial."}
      </p>

      <SectionHeading>Posição dos envolvidos</SectionHeading>
      {edge.cited_positions && edge.cited_positions.length > 0 ? (
        <ul className="space-y-1.5">
          {edge.cited_positions.map((position, i) => (
            <Position
              key={`${position.by_id ?? position.by ?? "position"}-${i}`}
              position={position}
              sourceIndex={sourceIndex}
            />
          ))}
        </ul>
      ) : (
        <p className="text-fg-3 text-xs">Posição não localizada no corpus.</p>
      )}
    </PanelShell>
  );
}
