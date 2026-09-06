"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ALL_NODE_CATEGORIES,
  ALL_EVIDENCE_CLASSES,
  RELATIONSHIP_TYPE_OPTIONS,
  defaultFilterState,
  type FilterState,
} from "@/lib/graph/filters";
import { NODE_CATEGORY_LABEL } from "@/lib/graph/types";
import { EVIDENCE_CLASS_LABEL, RELATIONSHIP_TYPE_LABEL } from "@/lib/schema";

const extras: Record<string, string> = {
  participation: "Participação em evento",
  actor: "Atuação em ato público",
  transaction: "Transação",
  supports: "Sustenta",
  documents: "Documenta",
  originates_from: "Origina-se em",
  mentions: "Menciona",
};
export function filterChips(
  filters: FilterState,
): { label: string; patch: Partial<FilterState> }[] {
  const defaults = defaultFilterState();
  const chips: { label: string; patch: Partial<FilterState> }[] = [];
  if (filters.officialOnly)
    chips.push({ label: "Fontes oficiais", patch: { officialOnly: false } });
  if (filters.documentedOnly)
    chips.push({ label: "Fatos documentados", patch: { documentedOnly: false } });
  if (filters.dateUntil)
    chips.push({
      label: `Até ${filters.dateUntil.split("-").reverse().join("/")}`,
      patch: { dateUntil: undefined },
    });
  if (
    filters.nodeCategories.size !== defaults.nodeCategories.size ||
    [...filters.nodeCategories].some((c) => !defaults.nodeCategories.has(c))
  )
    chips.push({
      label:
        filters.nodeCategories.size === 1
          ? NODE_CATEGORY_LABEL[[...filters.nodeCategories][0]]
          : `Tipos de nó: ${filters.nodeCategories.size}`,
      patch: { nodeCategories: defaults.nodeCategories },
    });
  if (filters.evidenceClasses.size !== defaults.evidenceClasses.size)
    chips.push({
      label: `Evidência: ${[...filters.evidenceClasses].join(", ") || "nenhuma"}`,
      patch: { evidenceClasses: defaults.evidenceClasses },
    });
  if (filters.relationshipTypes.size !== defaults.relationshipTypes.size)
    chips.push({
      label: `Relações: ${filters.relationshipTypes.size}`,
      patch: { relationshipTypes: defaults.relationshipTypes },
    });
  return chips;
}
function Choice({
  children,
  checked,
  onChange,
}: {
  children: ReactNode;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="mobile-filter-choice">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}
export function MobileFilters({
  filters,
  count,
  onApply,
  onClose,
  ensureEvidenceLayer,
}: {
  filters: FilterState;
  count: (f: FilterState) => number;
  onApply: (f: FilterState) => void;
  onClose: () => void;
  ensureEvidenceLayer: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(filters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef(0);
  const patch = (p: Partial<FilterState>) => setDraft((current) => ({ ...current, ...p }));
  const total = useMemo(() => count(draft), [count, draft]);
  useEffect(() => {
    const requests = pending;
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      requests.current++;
      element?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected && previous.getClientRects().length) previous.focus();
    };
  }, []);
  const toggle = <T,>(items: Set<T>, value: T) => {
    const next = new Set(items);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };
  const loadEvidence = async () => {
    const request = ++pending.current;
    setLoading(true);
    setError(false);
    try {
      await ensureEvidenceLayer();
    } catch {
      if (request === pending.current) setError(true);
    } finally {
      if (request === pending.current) setLoading(false);
    }
  };
  return createPortal(
    <dialog
      ref={dialog}
      className="mobile-filter-dialog"
      aria-labelledby="mobile-filter-heading"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2 id="mobile-filter-heading">Filtrar o mapa</h2>
        <button type="button" onClick={onClose} aria-label="Fechar filtros sem aplicar">
          ×
        </button>
      </header>
      <div className="mobile-filter-body">
        <p>Escolha os filtros e aplique quando terminar.</p>
        <details open>
          <summary>
            Tipo de pessoa ou entidade <span>{draft.nodeCategories.size} selecionados</span>
          </summary>
          <div className="mobile-filter-shortcuts">
            <button
              onClick={() => {
                patch({ nodeCategories: new Set(ALL_NODE_CATEGORIES) });
                void loadEvidence();
              }}
              type="button"
              disabled={loading}
            >
              Selecionar todos
            </button>
            <button onClick={() => patch({ nodeCategories: new Set() })} type="button">
              Desmarcar todos
            </button>
          </div>
          {ALL_NODE_CATEGORIES.map((category) => (
            <Choice
              key={category}
              checked={draft.nodeCategories.has(category)}
              onChange={() => {
                patch({ nodeCategories: toggle(draft.nodeCategories, category) });
                if (
                  ["document", "source", "claim", "evidence"].includes(category) &&
                  !draft.nodeCategories.has(category)
                )
                  void loadEvidence();
              }}
            >
              {NODE_CATEGORY_LABEL[category]}
            </Choice>
          ))}
        </details>
        <details>
          <summary>Fontes e evidências</summary>
          <Choice
            checked={draft.officialOnly}
            onChange={() => patch({ officialOnly: !draft.officialOnly })}
          >
            Apenas fontes oficiais
          </Choice>
          <Choice
            checked={draft.documentedOnly}
            onChange={() => patch({ documentedOnly: !draft.documentedOnly })}
          >
            Somente fatos documentados
          </Choice>
          <p>Fatos documentados incluem as classes D e C. Alegações e inferências ficam de fora.</p>
          {ALL_EVIDENCE_CLASSES.map((value) => (
            <Choice
              key={value}
              checked={draft.evidenceClasses.has(value)}
              onChange={() => patch({ evidenceClasses: toggle(draft.evidenceClasses, value) })}
            >
              {value} · {EVIDENCE_CLASS_LABEL[value]}
            </Choice>
          ))}
        </details>
        <details>
          <summary>
            Tipo de relação <span>{draft.relationshipTypes.size} selecionados</span>
          </summary>
          {RELATIONSHIP_TYPE_OPTIONS.map((value) => (
            <Choice
              key={value}
              checked={draft.relationshipTypes.has(value)}
              onChange={() => patch({ relationshipTypes: toggle(draft.relationshipTypes, value) })}
            >
              {(RELATIONSHIP_TYPE_LABEL as Record<string, string>)[value] ?? extras[value] ?? value}
            </Choice>
          ))}
        </details>
        <details>
          <summary>
            Período <span>{draft.dateUntil ? "Data definida" : "Sem limite"}</span>
          </summary>
          <label className="mobile-filter-date">
            Mostrar relações até
            <input
              type="date"
              value={draft.dateUntil ?? ""}
              onChange={(event) => patch({ dateUntil: event.target.value || undefined })}
            />
          </label>
          <p>Relações sem data ficam fora quando um período é definido.</p>
        </details>
        {total === 0 && !loading && (
          <p role="status">
            Nenhum resultado com esta combinação. Amplie os tipos selecionados ou remova alguma
            condição.
          </p>
        )}
        {error && (
          <p role="alert">
            Não foi possível carregar os documentos e evidências.{" "}
            <button type="button" onClick={() => void loadEvidence()}>
              Tentar novamente
            </button>
          </p>
        )}
      </div>
      <footer>
        <button
          type="button"
          onClick={() => {
            patch(defaultFilterState());
            setError(false);
          }}
        >
          Limpar
        </button>
        <button
          className="mobile-filter-apply"
          type="button"
          disabled={loading || error}
          onClick={() => onApply(draft)}
        >
          {loading ? "Carregando…" : `Mostrar ${total} resultados`}
        </button>
      </footer>
    </dialog>,
    document.body,
  );
}
