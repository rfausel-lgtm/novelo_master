"use client";

import { useState } from "react";
import type { GraphIndex } from "@/lib/graph/indexes";
import { kPaths, type PathResult, type Visibility } from "@/lib/graph/algorithms";
import { EVIDENCE_CLASS_LABEL } from "@/lib/schema";
import { SearchBox } from "./SearchBox";
import { EvidenceBadge, PanelShell, SectionHeading, ToolButton } from "./ui";
import type { PathState } from "./useGraphState";

interface PathFinderProps {
  index: GraphIndex;
  path: PathState;
  vis: Visibility;
  onChange: (patch: Partial<PathState>) => void;
  onSelectNode: (id: string) => void;
  onClose: () => void;
}

/** "Como A se conecta a B?": caminho mínimo e alternativas, com realce no canvas. */
export function PathFinder({ index, path, vis, onChange, onSelectNode, onClose }: PathFinderProps) {
  const [searched, setSearched] = useState(false);
  const from = path.from ? index.nodeById.get(path.from) : undefined;
  const to = path.to ? index.nodeById.get(path.to) : undefined;

  const run = () => {
    if (!path.from || !path.to) return;
    const results = kPaths(index, path.from, path.to, path.respectFilters ? vis : undefined, { k: 3 });
    onChange({ results, active: 0 });
    setSearched(true);
  };

  const describe = (p: PathResult) => `${p.edges.length} salto${p.edges.length === 1 ? "" : "s"}`;

  return (
    <PanelShell title="Como A se conecta a B?" onClose={onClose} labelledBy="path-title">
      <h2 id="path-title" className="sr-only">
        Caminho entre dois nós
      </h2>
      <p className="text-fg-3 mt-2 text-xs">Escolha dois nós (ou clique neles no grafo). O caminho mais curto e até três alternativas são exibidos e realçados.</p>
      <div className="mt-2 space-y-2">
        <SearchBox key={`from-${path.from ?? ""}`} index={index} ariaLabel="Nó de origem" placeholder="De…" value={from?.label} compact onPick={(id) => onChange({ from: id, results: [], active: 0 })} />
        <SearchBox key={`to-${path.to ?? ""}`} index={index} ariaLabel="Nó de destino" placeholder="Até…" value={to?.label} compact onPick={(id) => onChange({ to: id, results: [], active: 0 })} />
        <label className="text-fg-2 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={path.respectFilters} onChange={(e) => onChange({ respectFilters: e.target.checked, results: [] })} className="accent-accent" />
          Respeitar filtros ativos (ex.: só fontes oficiais)
        </label>
        <div className="flex gap-1.5">
          <ToolButton primary onClick={run} disabled={!path.from || !path.to}>
            Buscar caminho
          </ToolButton>
          <ToolButton onClick={() => onChange({ from: null, to: null, results: [], active: 0 })}>Limpar</ToolButton>
        </div>
      </div>

      {searched && path.results.length === 0 && (
        <p className="text-fg-2 mt-3 text-xs">Não há caminho entre os dois nós no recorte atual. Isso significa apenas que o corpus não registra conexão documentada; não é evidência de ausência de relação.</p>
      )}

      {path.results.length > 0 && (
        <>
          <SectionHeading>Caminhos encontrados</SectionHeading>
          <ol className="space-y-2">
            {path.results.map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onChange({ active: i })}
                  aria-pressed={path.active === i}
                  className={`w-full rounded border px-2 py-1 text-left text-xs ${path.active === i ? "border-accent bg-accent/10 text-fg" : "border-border text-fg-2 hover:border-fg-3"}`}
                >
                  {i === 0 ? "Caminho mínimo" : `Alternativa ${i}`} · {describe(p)}
                </button>
                {path.active === i && (
                  <ol className="mt-1 ml-2 space-y-1 border-l pl-2 text-xs" style={{ borderColor: "var(--border)" }}>
                    {p.nodes.map((id, j) => {
                      const edge = j < p.edges.length ? index.edgeById.get(p.edges[j]) : undefined;
                      return (
                        <li key={`${id}-${j}`}>
                          <button type="button" onClick={() => onSelectNode(id)} className="text-fg hover:text-accent underline-offset-2 hover:underline">
                            {index.nodeById.get(id)?.label ?? id}
                          </button>
                          {edge && (
                            <div className="text-fg-3 flex flex-wrap items-center gap-1 py-0.5">
                              <span aria-hidden="true">↓</span> {edge.label}
                              <EvidenceBadge cls={edge.evidence_class} small />
                              <span className="sr-only">{EVIDENCE_CLASS_LABEL[edge.evidence_class]}</span>
                              {edge.official && <span className="text-fg-3">· fonte oficial</span>}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </PanelShell>
  );
}
