"use client";

import { useMemo, useState } from "react";
import type { GraphIndex } from "@/lib/graph/indexes";
import type { GraphEdge, GraphNode } from "@/lib/graph/types";
import { addDays, daysBetween, formatDatePT } from "@/lib/graph/dates";
import { EvidenceBadge, PanelShell, SectionHeading, ToolButton } from "./ui";

interface BeforeAfterProps {
  index: GraphIndex;
  node: GraphNode;
  onSelectNode: (id: string) => void;
  onClose: () => void;
}

type Item = { id: string; date: string; label: string; cls: GraphEdge["evidence_class"]; delta: number; isNode: boolean };

const WINDOWS = [7, 30, 90] as const;

const MEETING_TYPES = new Set(["meeting", "communication", "social_event", "travel", "statement"]);
const MONEY_TYPES = new Set(["payment", "transaction"]);

function groupOf(index: GraphIndex, item: Item): string {
  if (item.isNode) {
    const n = index.nodeById.get(item.id)!;
    if (n.kind === "public_act") return "Atos públicos";
    if (MEETING_TYPES.has(String(n.subtype))) return "Encontros e comunicações";
    if (MONEY_TYPES.has(String(n.subtype))) return "Pagamentos e transações";
    return "Outros eventos";
  }
  const e = index.edgeById.get(item.id)!;
  if (e.kind === "transaction") return "Pagamentos e transações";
  return "Novas relações";
}

/** Janela antes/depois de um evento ou ato: só proximidade temporal, nunca causalidade. */
export function BeforeAfter({ index, node, onSelectNode, onClose }: BeforeAfterProps) {
  const [win, setWin] = useState<(typeof WINDOWS)[number]>(30);
  const date = node.date;

  const { before, after } = useMemo(() => {
    const before: Item[] = [];
    const after: Item[] = [];
    if (!date) return { before, after };
    const lo = addDays(date, -win);
    const hi = addDays(date, win);
    const push = (item: Item) => (item.delta < 0 ? before : after).push(item);
    for (const n of index.nodeById.values()) {
      if (n.id === node.id || !n.date || (n.kind !== "event" && n.kind !== "public_act")) continue;
      if (n.date < lo || n.date > hi) continue;
      const delta = daysBetween(date, n.date);
      if (delta === 0) continue;
      const anyEdge = index.adjacency.get(n.id)?.[0];
      const cls = anyEdge ? index.edgeById.get(anyEdge.edge)!.evidence_class : "I";
      push({ id: n.id, date: n.date, label: n.label, cls, delta, isNode: true });
    }
    for (const e of index.edgeById.values()) {
      if ((e.kind !== "relationship" && e.kind !== "transaction") || !e.since) continue;
      if (e.since < lo || e.since > hi) continue;
      const delta = daysBetween(date, e.since);
      if (delta === 0) continue;
      const a = index.nodeById.get(e.source)?.label ?? e.source;
      const b = index.nodeById.get(e.target)?.label ?? e.target;
      push({ id: e.id, date: e.since, label: `${a} · ${e.label} · ${b}`, cls: e.evidence_class, delta, isNode: false });
    }
    before.sort((x, y) => y.date.localeCompare(x.date));
    after.sort((x, y) => x.date.localeCompare(y.date));
    return { before, after };
  }, [index, node, date, win]);

  const render = (items: Item[], side: "antes" | "depois") => {
    if (items.length === 0) return <p className="text-fg-3 text-xs">Nada registrado no corpus nesta janela.</p>;
    const groups = new Map<string, Item[]>();
    for (const it of items) {
      const g = groupOf(index, it);
      groups.set(g, [...(groups.get(g) ?? []), it]);
    }
    return (
      <div className="space-y-2">
        {[...groups.entries()].map(([g, list]) => (
          <div key={g}>
            <div className="text-fg-2 text-[11px] font-medium">{g}</div>
            <ul className="space-y-0.5 text-xs">
              {list.map((it) => (
                <li key={it.id} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-fg-3 tabular-nums">
                    {Math.abs(it.delta)} d {side} · {formatDatePT(it.date)}
                  </span>
                  {it.isNode ? (
                    <button type="button" onClick={() => onSelectNode(it.id)} className="text-fg hover:text-accent text-left underline-offset-2 hover:underline">
                      {it.label}
                    </button>
                  ) : (
                    <span className="text-fg">{it.label}</span>
                  )}
                  <EvidenceBadge cls={it.cls} small />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PanelShell title="Antes e depois" onClose={onClose} labelledBy="ba-title">
      <h2 id="ba-title" className="sr-only">
        Antes e depois
      </h2>
      <p className="text-fg mt-2 text-sm font-medium">{node.label}</p>
      <p className="text-fg-3 text-xs">{formatDatePT(date)}</p>
      {!date ? (
        <p className="text-fg-2 mt-2 text-xs">Este nó não tem data; escolha um evento ou ato público.</p>
      ) : (
        <>
          <div className="mt-2 flex gap-1.5">
            {WINDOWS.map((w) => (
              <ToolButton key={w} active={win === w} onClick={() => setWin(w)}>
                ±{w} dias
              </ToolButton>
            ))}
          </div>
          <p className="border-border bg-bg-3/60 mt-2 rounded border px-2 py-1 text-[11px]">
            Proximidade temporal não implica causalidade. Esta lista mostra apenas o que o corpus registra perto da data.
          </p>
          <SectionHeading>{win} dias antes</SectionHeading>
          {render(before, "antes")}
          <SectionHeading>{win} dias depois</SectionHeading>
          {render(after, "depois")}
        </>
      )}
    </PanelShell>
  );
}
