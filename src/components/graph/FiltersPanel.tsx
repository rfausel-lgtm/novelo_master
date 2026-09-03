"use client";

import type { EvidenceClass } from "@/lib/schema";
import { EVIDENCE_CLASS_LABEL, RELATIONSHIP_TYPE_LABEL } from "@/lib/schema";
import {
  ALL_EVIDENCE_CLASSES,
  ALL_NODE_CATEGORIES,
  RELATIONSHIP_TYPE_OPTIONS,
  isFilterActive,
  type FilterState,
} from "@/lib/graph/filters";
import { NODE_CATEGORY_LABEL, type NodeCategory } from "@/lib/graph/types";
import { FAMILY_COLOR_FALLBACK } from "@/lib/graph/style";
import { RELATIONSHIP_FAMILY } from "@/lib/schema";
import type { GraphAction } from "./useGraphState";
import { PanelShell, SectionHeading, ToolButton } from "./ui";

const EXTRA_TYPE_LABEL: Record<string, string> = {
  participation: "Participação em evento",
  actor: "Atuação em ato público",
  transaction: "Transação",
  supports: "Sustenta",
  documents: "Documenta",
  originates_from: "Origina-se em",
  mentions: "Menciona",
};

const EVIDENCE_LAYER: NodeCategory[] = ["document", "source", "claim", "evidence"];

interface FiltersPanelProps {
  filters: FilterState;
  dispatch: (a: GraphAction) => void;
  visibleNodes: number;
  visibleEdges: number;
  layerLoading?: boolean;
  onClose: () => void;
}

function Check({
  id,
  label,
  checked,
  onChange,
  color,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  color?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="hover:bg-bg-3/60 flex cursor-pointer items-center gap-2 rounded px-1 py-0.5"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-accent h-3.5 w-3.5"
      />
      {color && (
        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: color }} />
      )}
      <span className="text-fg-2 text-xs">{label}</span>
    </label>
  );
}

export function FiltersPanel({
  filters,
  dispatch,
  visibleNodes,
  visibleEdges,
  layerLoading = false,
  onClose,
}: FiltersPanelProps) {
  return (
    <PanelShell title="Filtros" onClose={onClose} labelledBy="filters-title">
      <h2 id="filters-title" className="sr-only">
        Filtros do grafo
      </h2>
      <div className="mt-3 flex flex-col gap-2">
        <ToolButton
          primary
          active={filters.officialOnly}
          onClick={() =>
            dispatch({ type: "filters", patch: { officialOnly: !filters.officialOnly } })
          }
          className="h-9 justify-center tracking-wide"
        >
          MOSTRAR APENAS FONTES OFICIAIS
        </ToolButton>
        <ToolButton
          primary
          active={filters.documentedOnly}
          onClick={() =>
            dispatch({ type: "filters", patch: { documentedOnly: !filters.documentedOnly } })
          }
          className="h-9 justify-center tracking-wide"
        >
          MOSTRAR SOMENTE FATOS DOCUMENTADOS
        </ToolButton>
        <p className="text-fg-3 text-[11px]">
          Fontes oficiais: STF, STJ, Justiça Federal, PF, PGR/MPF, Câmara, Senado, Banco Central,
          CVM, TCU, Diário Oficial e registros societários. Fatos documentados: classes D e C
          (exclui alegações e inferências).
        </p>
      </div>

      <div className="text-fg-2 mt-3 text-xs tabular-nums" aria-live="polite">
        {visibleNodes} nós · {visibleEdges} arestas visíveis
        {isFilterActive(filters) && (
          <button
            type="button"
            onClick={() => dispatch({ type: "resetFilters" })}
            className="text-accent ml-2 underline underline-offset-2"
          >
            limpar filtros
          </button>
        )}
      </div>

      <div className="mt-3">
        <ToolButton
          active={EVIDENCE_LAYER.every((category) => filters.nodeCategories.has(category))}
          onClick={() => {
            const nodeCategories = new Set(filters.nodeCategories);
            const enabled = EVIDENCE_LAYER.every((category) => nodeCategories.has(category));
            for (const category of EVIDENCE_LAYER) {
              if (enabled) nodeCategories.delete(category);
              else nodeCategories.add(category);
            }
            dispatch({ type: "filters", patch: { nodeCategories } });
          }}
          className="h-9 w-full justify-center"
        >
          CAMADA DE EVIDÊNCIA
        </ToolButton>
        <p className="text-fg-3 mt-1 text-[11px]" aria-live="polite">
          {layerLoading
            ? "Carregando a camada probatória…"
            : "Exibe documentos, fontes, claims e evidências e seus vínculos de rastreabilidade. Baixada sob demanda."}
        </p>
      </div>

      <SectionHeading>Tipo de nó</SectionHeading>
      <div className="grid grid-cols-2">
        {ALL_NODE_CATEGORIES.map((c: NodeCategory) => (
          <Check
            key={c}
            id={`f-cat-${c}`}
            label={NODE_CATEGORY_LABEL[c]}
            checked={filters.nodeCategories.has(c)}
            onChange={() => dispatch({ type: "toggleCategory", category: c })}
          />
        ))}
      </div>

      <SectionHeading>Força da evidência</SectionHeading>
      <div className="grid grid-cols-2">
        {ALL_EVIDENCE_CLASSES.map((c: EvidenceClass) => (
          <Check
            key={c}
            id={`f-ev-${c}`}
            label={`${c} · ${EVIDENCE_CLASS_LABEL[c]}`}
            checked={filters.evidenceClasses.has(c)}
            onChange={() => dispatch({ type: "toggleEvidenceClass", evidenceClass: c })}
          />
        ))}
      </div>

      <SectionHeading>Tipo de relação</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {RELATIONSHIP_TYPE_OPTIONS.map((t) => {
          const label =
            (RELATIONSHIP_TYPE_LABEL as Record<string, string>)[t] ?? EXTRA_TYPE_LABEL[t] ?? t;
          const family = (
            RELATIONSHIP_FAMILY as Record<string, keyof typeof FAMILY_COLOR_FALLBACK>
          )[t];
          return (
            <Check
              key={t}
              id={`f-rel-${t}`}
              label={label}
              color={family ? FAMILY_COLOR_FALLBACK[family] : "#9aa4b1"}
              checked={filters.relationshipTypes.has(t)}
              onChange={() => dispatch({ type: "toggleRelationshipType", relationshipType: t })}
            />
          );
        })}
      </div>
    </PanelShell>
  );
}
