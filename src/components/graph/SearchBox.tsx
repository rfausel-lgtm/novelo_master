"use client";

import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import type { GraphIndex } from "@/lib/graph/indexes";
import { searchNodes, type SearchHit } from "@/lib/graph/search";
import { NODE_CATEGORY_LABEL } from "@/lib/graph/types";

interface SearchBoxProps {
  index: GraphIndex;
  /** Restringe os resultados aos nós visíveis, se informado. */
  only?: ReadonlySet<string>;
  placeholder?: string;
  ariaLabel: string;
  onPick: (id: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Valor inicial exibido (ex.: rótulo do nó já escolhido). */
  value?: string;
  compact?: boolean;
  autoFocus?: boolean;
}

/** Busca instantânea (difusa) com listbox navegável por teclado (padrão combobox). */
export function SearchBox({ index, only, placeholder, ariaLabel, onPick, inputRef, value, compact, autoFocus }: SearchBoxProps) {
  const [query, setQuery] = useState(value ?? "");
  const [debounced, setDebounced] = useState(query);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const localRef = useRef<HTMLInputElement | null>(null);
  const ref = inputRef ?? localRef;
  const listId = useId();

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value ?? "");
  }
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 120);
    return () => clearTimeout(t);
  }, [query]);

  const hits: SearchHit[] = useMemo(() => (debounced.trim() ? searchNodes(index, debounced, 10, only) : []), [index, debounced, only]);

  const [prevHits, setPrevHits] = useState(hits);
  if (hits !== prevHits) {
    setPrevHits(hits);
    setActive(0);
  }

  const pick = (hit: SearchHit) => {
    onPick(hit.node.id);
    setQuery(hit.node.label);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        ref={ref}
        type="search"
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open && hits.length > 0}
        aria-controls={listId}
        aria-activedescendant={open && hits[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder ?? "Buscar pessoa, organização, evento…"}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(hits.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter") {
            if (hits[active]) {
              e.preventDefault();
              pick(hits[active]);
            }
          } else if (e.key === "Escape") {
            if (open) {
              e.stopPropagation();
              setOpen(false);
            }
          }
        }}
        className={`border-border-strong bg-bg-2/95 text-fg placeholder:text-fg-3 focus:border-accent w-full rounded-md border pr-2 pl-8 text-sm outline-none backdrop-blur ${compact ? "h-8" : "h-9"}`}
      />
      <svg aria-hidden="true" viewBox="0 0 20 20" className="text-fg-3 pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2">
        <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {open && hits.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Resultados da busca"
          className="border-border-strong bg-bg-2 absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border py-1 shadow-xl"
        >
          {hits.map((hit, i) => (
            <li
              key={hit.node.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(hit)}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm ${i === active ? "bg-bg-3 text-fg" : "text-fg-2"}`}
            >
              <span className="truncate">{hit.node.label}</span>
              <span className="text-fg-3 shrink-0 text-[10.5px]">
                {NODE_CATEGORY_LABEL[hit.node.category]} · {hit.node.degree}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
