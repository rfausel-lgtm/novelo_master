"use client";

import { useMemo } from "react";
import type { GraphIndex } from "@/lib/graph/indexes";
import { commonNeighbors, intermediaries, sharedEvents, shortestPath, type Visibility } from "@/lib/graph/algorithms";
import { formatDatePT } from "@/lib/graph/dates";
import { EvidenceBadge, PanelShell, SectionHeading, ToolButton } from "./ui";

interface SelectionPanelProps {
  index: GraphIndex;
  selection: string[];
  vis: Visibility;
  isolate: { withNeighbors: boolean } | null;
  onIsolate: (v: { withNeighbors: boolean } | null) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onSelectNode: (id: string) => void;
  onClose: () => void;
  onExit: () => void;
}

function NodeLink({ index, id, onSelectNode }: { index: GraphIndex; id: string; onSelectNode: (id: string) => void }) {
  const n = index.nodeById.get(id);
  if (!n) return null;
  return (
    <button type="button" onClick={() => onSelectNode(id)} className="text-fg hover:text-accent text-left underline-offset-2 hover:underline">
      {n.label}
    </button>
  );
}

export function SelectionPanel(props: SelectionPanelProps) {
  const { index, selection, vis, isolate, onIsolate, onRemove, onClear, onSelectNode, onClose, onExit } = props;

  const analysis = useMemo(() => {
    if (selection.length < 2) return null;
    const common = commonNeighbors(index, selection, vis).filter((id) => index.nodeById.get(id)?.kind !== "event");
    const events = sharedEvents(index, selection, vis);
    const inter = intermediaries(index, selection, vis);
    const orgs = common.filter((id) => index.nodeById.get(id)?.kind === "organization");
    const pairs: { a: string; b: string; path: ReturnType<typeof shortestPath> }[] = [];
    for (let i = 0; i < selection.length && pairs.length < 6; i++) {
      for (let j = i + 1; j < selection.length && pairs.length < 6; j++) {
        pairs.push({ a: selection[i], b: selection[j], path: shortestPath(index, selection[i], selection[j], vis, 6) });
      }
    }
    return { common, events, inter, orgs, pairs };
  }, [index, selection, vis]);

  return (
    <PanelShell title={`Seleção múltipla (${selection.length})`} onClose={onClose} labelledBy="selection-title">
      <h2 id="selection-title" className="sr-only">
        Seleção múltipla
      </h2>
      <p className="text-fg-3 mt-2 text-xs">Clique em nós do grafo para adicioná-los. Com dois ou mais, veja o que têm em comum.</p>
      <ul className="mt-2 space-y-1">
        {selection.map((id) => (
          <li key={id} className="flex items-center justify-between gap-2">
            <NodeLink index={index} id={id} onSelectNode={onSelectNode} />
            <button type="button" onClick={() => onRemove(id)} aria-label={`Remover ${index.nodeById.get(id)?.label ?? id} da seleção`} className="text-fg-3 hover:text-fg text-xs">
              remover
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <ToolButton active={!!isolate && !isolate.withNeighbors} onClick={() => onIsolate(isolate && !isolate.withNeighbors ? null : { withNeighbors: false })} disabled={selection.length === 0}>
          Isolar seleção
        </ToolButton>
        <ToolButton active={!!isolate?.withNeighbors} onClick={() => onIsolate(isolate?.withNeighbors ? null : { withNeighbors: true })} disabled={selection.length === 0}>
          Isolar + vizinhos
        </ToolButton>
        <ToolButton onClick={onClear} disabled={selection.length === 0}>
          Limpar
        </ToolButton>
        <ToolButton onClick={onExit}>Sair do modo</ToolButton>
      </div>

      {analysis && (
        <>
          <SectionHeading>Conexões comuns ({analysis.common.length})</SectionHeading>
          {analysis.common.length === 0 ? (
            <p className="text-fg-3 text-xs">Nenhuma conexão comum direta.</p>
          ) : (
            <ul className="space-y-0.5 text-xs">
              {analysis.common.slice(0, 20).map((id) => (
                <li key={id}>
                  <NodeLink index={index} id={id} onSelectNode={onSelectNode} />
                </li>
              ))}
            </ul>
          )}

          <SectionHeading>Eventos compartilhados ({analysis.events.length})</SectionHeading>
          {analysis.events.length === 0 ? (
            <p className="text-fg-3 text-xs">Nenhum evento em que todos participem.</p>
          ) : (
            <ul className="space-y-0.5 text-xs">
              {analysis.events.slice(0, 20).map((id) => {
                const n = index.nodeById.get(id);
                return (
                  <li key={id} className="flex gap-2">
                    <span className="text-fg-3 shrink-0 tabular-nums">{formatDatePT(n?.date)}</span>
                    <NodeLink index={index} id={id} onSelectNode={onSelectNode} />
                  </li>
                );
              })}
            </ul>
          )}

          <SectionHeading>Intermediários ({analysis.inter.length})</SectionHeading>
          {analysis.inter.length === 0 ? (
            <p className="text-fg-3 text-xs">Nenhum nó liga todos os selecionados sem estar entre eles.</p>
          ) : (
            <ul className="space-y-0.5 text-xs">
              {analysis.inter.slice(0, 20).map((id) => (
                <li key={id}>
                  <NodeLink index={index} id={id} onSelectNode={onSelectNode} />
                </li>
              ))}
            </ul>
          )}

          <SectionHeading>Organizações relacionadas ({analysis.orgs.length})</SectionHeading>
          {analysis.orgs.length === 0 ? (
            <p className="text-fg-3 text-xs">Nenhuma organização comum.</p>
          ) : (
            <ul className="space-y-0.5 text-xs">
              {analysis.orgs.map((id) => (
                <li key={id}>
                  <NodeLink index={index} id={id} onSelectNode={onSelectNode} />
                </li>
              ))}
            </ul>
          )}

          <SectionHeading>Caminhos entre os selecionados</SectionHeading>
          <ul className="space-y-1.5 text-xs">
            {analysis.pairs.map(({ a, b, path }) => (
              <li key={`${a}-${b}`}>
                <div className="text-fg-2">
                  {index.nodeById.get(a)?.label} → {index.nodeById.get(b)?.label}
                </div>
                {!path ? (
                  <div className="text-fg-3">Sem caminho no recorte atual.</div>
                ) : (
                  <ol className="text-fg-3 ml-2 space-y-0.5 border-l pl-2" style={{ borderColor: "var(--border)" }}>
                    {path.nodes.map((id, i) => (
                      <li key={id} className="flex flex-wrap items-center gap-1">
                        <NodeLink index={index} id={id} onSelectNode={onSelectNode} />
                        {i < path.edges.length && (
                          <span className="text-fg-3 inline-flex items-center gap-1">
                            · {index.edgeById.get(path.edges[i])?.label}
                            <EvidenceBadge cls={index.edgeById.get(path.edges[i])!.evidence_class} small />
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </PanelShell>
  );
}
