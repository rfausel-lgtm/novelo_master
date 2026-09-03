"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GraphIndex } from "@/lib/graph/indexes";
import { NODE_CATEGORY_LABEL, type GraphNode } from "@/lib/graph/types";
import { NODE_COLOR_FALLBACK } from "@/lib/graph/style";
import { formatDatePT } from "@/lib/graph/dates";
import { EVENT_TYPE_LABEL, ORG_TYPE_LABEL, PERSON_CATEGORY_LABEL, PUBLIC_ACT_TYPE_LABEL } from "@/lib/schema";
import { Counter, PanelShell, SectionHeading, ToolButton } from "./ui";

interface NodeCardProps {
  index: GraphIndex;
  node: GraphNode;
  focusDepth: 1 | 2 | null;
  inSelection: boolean;
  onClose: () => void;
  onSelectNode: (id: string) => void;
  onFocus: (depth: 1 | 2 | null) => void;
  onAddToSelection: () => void;
  onPathFrom: () => void;
  onBeforeAfter: () => void;
}

function subtypeLabel(node: GraphNode): string {
  const s = node.subtype as string;
  if (node.kind === "person") return (PERSON_CATEGORY_LABEL as Record<string, string>)[s] ?? s;
  if (node.kind === "organization") return (ORG_TYPE_LABEL as Record<string, string>)[s] ?? s;
  if (node.kind === "event") return (EVENT_TYPE_LABEL as Record<string, string>)[s] ?? s;
  if (node.kind === "public_act") return (PUBLIC_ACT_TYPE_LABEL as Record<string, string>)[s] ?? s;
  return s;
}

function initials(label: string): string {
  const parts = label.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}

function Avatar({ node }: { node: GraphNode }) {
  const [broken, setBroken] = useState(false);
  const color = NODE_COLOR_FALLBACK[node.category];
  const imgKind = node.kind === "person" ? "pessoas" : "organizacoes";
  if (node.has_photo && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/images/${imgKind}/${node.id}.webp`}
        alt=""
        width={48}
        height={48}
        onError={() => setBroken(true)}
        className="border-border h-12 w-12 shrink-0 rounded-full border object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      style={{ background: `${color}22`, color, border: `1px solid ${color}66` }}
    >
      {node.kind === "person" ? initials(node.label).toUpperCase() : node.kind === "organization" ? "◼" : node.kind === "event" ? "◆" : "§"}
    </div>
  );
}

export function NodeCard(props: NodeCardProps) {
  const { index, node, focusDepth, inSelection, onClose, onSelectNode, onFocus, onAddToSelection, onPathFrom, onBeforeAfter } = props;
  const [showAll, setShowAll] = useState(false);

  const connections = useMemo(() => {
    const seen = new Map<string, { node: GraphNode; edgeLabel: string; count: number }>();
    for (const a of index.adjacency.get(node.id) ?? []) {
      const other = index.nodeById.get(a.other);
      const edge = index.edgeById.get(a.edge);
      if (!other || !edge) continue;
      const hit = seen.get(other.id);
      if (hit) hit.count++;
      else seen.set(other.id, { node: other, edgeLabel: edge.label, count: 1 });
    }
    return [...seen.values()].sort((a, b) => b.node.degree - a.node.degree);
  }, [index, node.id]);

  const timeline = useMemo(() => {
    const items: { date: string; label: string; other: GraphNode; edgeId: string; cls: GraphNode["kind"] }[] = [];
    for (const a of index.adjacency.get(node.id) ?? []) {
      const edge = index.edgeById.get(a.edge);
      const other = index.nodeById.get(a.other);
      if (!edge?.since || !other) continue;
      items.push({ date: edge.since, label: edge.label, other, edgeId: edge.id, cls: other.kind });
    }
    items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return items;
  }, [index, node.id]);

  const isAgent = node.kind === "person" || node.kind === "organization";
  const isEvent = node.kind === "event" || node.kind === "public_act";
  const participants = isEvent ? connections : [];
  const shown = showAll ? connections : connections.slice(0, 8);

  return (
    <PanelShell
      onClose={onClose}
      labelledBy="node-card-title"
      title={
        <span className="text-fg-3 text-[10.5px] font-semibold tracking-[0.14em] uppercase">
          {NODE_CATEGORY_LABEL[node.category]}
        </span>
      }
    >
      <div className="mt-3 flex items-start gap-3">
        {isAgent && <Avatar node={node} />}
        <div className="min-w-0">
          <h2 id="node-card-title" className="text-fg text-base leading-tight font-semibold">
            {node.label}
          </h2>
          <p className="text-fg-2 mt-0.5 text-xs">
            {node.role ?? subtypeLabel(node)}
            {isEvent && node.date && <> · {formatDatePT(node.date)}</>}
          </p>
        </div>
      </div>

      {node.why && (
        <>
          <SectionHeading>Por que está no Novelo?</SectionHeading>
          <p className="text-fg-2 text-[13px] leading-relaxed">{node.why}</p>
        </>
      )}

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        <Counter label="conexões" value={node.degree} />
        <Counter label="eventos" value={node.event_count} />
        <Counter label="fontes oficiais" value={node.official_source_count} />
        <Counter label="evidências" value={node.evidence_count} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Link
          href={node.href}
          className="bg-accent text-bg inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold hover:opacity-90"
          data-testid="open-dossier"
        >
          Abrir dossiê completo
        </Link>
        <ToolButton active={focusDepth === 1} onClick={() => onFocus(focusDepth === 1 ? null : 1)} aria-label="Focar: mostrar só o primeiro grau">
          Focar
        </ToolButton>
        <ToolButton active={focusDepth === 2} onClick={() => onFocus(focusDepth === 2 ? null : 2)} aria-label="Expandir para o segundo grau">
          Expandir 2º grau
        </ToolButton>
        <ToolButton active={inSelection} onClick={onAddToSelection}>
          {inSelection ? "Na seleção" : "Adicionar à seleção"}
        </ToolButton>
        <ToolButton onClick={onPathFrom}>Caminho até…</ToolButton>
        {isEvent && <ToolButton onClick={onBeforeAfter}>Antes / depois</ToolButton>}
      </div>

      {isEvent ? (
        <>
          <SectionHeading>Participantes ({participants.length})</SectionHeading>
          <ConnectionList items={shown} onSelectNode={onSelectNode} />
        </>
      ) : (
        <>
          <SectionHeading>Principais conexões ({connections.length})</SectionHeading>
          <ConnectionList items={shown} onSelectNode={onSelectNode} />
        </>
      )}
      {connections.length > 8 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="text-accent mt-1.5 text-xs hover:underline">
          {showAll ? "Mostrar menos" : `Mostrar todas (${connections.length})`}
        </button>
      )}

      {timeline.length > 0 && (
        <>
          <SectionHeading>Linha do tempo das conexões</SectionHeading>
          <ol className="border-border ml-1.5 border-l pl-3">
            {timeline.slice(0, 12).map((t) => (
              <li key={t.edgeId} className="relative mb-1.5 text-xs">
                <span aria-hidden="true" className="bg-fg-3 absolute top-1.5 -left-[15.5px] h-1.5 w-1.5 rounded-full" />
                <span className="text-fg-3 font-mono text-[11px] tabular-nums">{formatDatePT(t.date)}</span>{" "}
                <span className="text-fg-2">{t.label}</span>{" "}
                <button type="button" onClick={() => onSelectNode(t.other.id)} className="text-fg hover:underline">
                  {t.other.label}
                </button>
              </li>
            ))}
            {timeline.length > 12 && <li className="text-fg-3 text-[11px]">… e mais {timeline.length - 12}</li>}
          </ol>
        </>
      )}
    </PanelShell>
  );
}

function ConnectionList({
  items,
  onSelectNode,
}: {
  items: { node: GraphNode; edgeLabel: string; count: number }[];
  onSelectNode: (id: string) => void;
}) {
  if (items.length === 0) return <p className="text-fg-3 text-xs">Nenhuma conexão registrada.</p>;
  return (
    <ul className="divide-border divide-y">
      {items.map((c) => (
        <li key={c.node.id}>
          <button
            type="button"
            onClick={() => onSelectNode(c.node.id)}
            className="hover:bg-bg-3 flex w-full items-center gap-2 rounded px-1 py-1.5 text-left"
          >
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: NODE_COLOR_FALLBACK[c.node.category] }} />
            <span className="text-fg min-w-0 flex-1 truncate text-xs">{c.node.label}</span>
            <span className="text-fg-3 shrink-0 truncate text-[10.5px]">
              {c.edgeLabel}
              {c.count > 1 && ` +${c.count - 1}`}
            </span>
            <span className="text-fg-3 shrink-0 font-mono text-[10.5px] tabular-nums">{c.node.degree}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
