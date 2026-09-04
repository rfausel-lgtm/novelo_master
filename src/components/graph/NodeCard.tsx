"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GraphIndex } from "@/lib/graph/indexes";
import { NODE_CATEGORY_LABEL, type GraphNode } from "@/lib/graph/types";
import { NODE_COLOR_FALLBACK } from "@/lib/graph/style";
import { formatDatePT } from "@/lib/graph/dates";
import { neighborhood } from "@/lib/graph/algorithms";
import {
  EVENT_TYPE_LABEL,
  ORG_TYPE_LABEL,
  PERSON_CATEGORY_LABEL,
  PUBLIC_ACT_TYPE_LABEL,
} from "@/lib/schema";
import { Counter, PanelShell, SectionHeading, ToolButton } from "./ui";

interface NodeCardProps {
  index: GraphIndex;
  node: GraphNode;
  visible: { nodes: ReadonlySet<string>; edges: ReadonlySet<string> };
  focusDepth: 1 | 2 | 3 | null;
  inSelection: boolean;
  pinned: boolean;
  onClose: () => void;
  onSelectNode: (id: string) => void;
  onFocus: (depth: 1 | 2 | 3 | null) => void;
  onAddToSelection: () => void;
  onPathFrom: () => void;
  onBeforeAfter: () => void;
  onTogglePinned: () => void;
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
  const isOrg = node.kind === "organization";
  if (node.photo_path && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={node.photo_path}
        alt={node.photo_alt ?? ""}
        width={48}
        height={48}
        onError={() => setBroken(true)}
        className={`border-border h-12 w-12 shrink-0 border ${isOrg ? "bg-bg-2 rounded-md object-contain p-1" : "rounded-full object-cover"}`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      style={{ background: `${color}22`, color, border: `1px solid ${color}66` }}
    >
      {node.kind === "person"
        ? initials(node.label).toUpperCase()
        : node.kind === "organization"
          ? "◼"
          : node.kind === "event"
            ? "◆"
            : "§"}
    </div>
  );
}

export function NodeCard(props: NodeCardProps) {
  const {
    index,
    node,
    visible,
    focusDepth,
    inSelection,
    pinned,
    onClose,
    onSelectNode,
    onFocus,
    onAddToSelection,
    onPathFrom,
    onBeforeAfter,
    onTogglePinned,
  } = props;
  const [showAll, setShowAll] = useState(false);

  const connections = useMemo(() => {
    const seen = new Map<string, { node: GraphNode; edgeLabel: string; count: number }>();
    for (const a of index.adjacency.get(node.id) ?? []) {
      if (!visible.edges.has(a.edge) || !visible.nodes.has(a.other)) continue;
      const other = index.nodeById.get(a.other);
      const edge = index.edgeById.get(a.edge);
      if (!other || !edge) continue;
      const hit = seen.get(other.id);
      if (hit) hit.count++;
      else seen.set(other.id, { node: other, edgeLabel: edge.label, count: 1 });
    }
    return [...seen.values()].sort((a, b) => b.node.degree - a.node.degree);
  }, [index, node.id, visible]);

  const timeline = useMemo(() => {
    const items: {
      date: string;
      label: string;
      other: GraphNode;
      edgeId: string;
      cls: GraphNode["kind"];
    }[] = [];
    for (const a of index.adjacency.get(node.id) ?? []) {
      if (!visible.edges.has(a.edge) || !visible.nodes.has(a.other)) continue;
      const edge = index.edgeById.get(a.edge);
      const other = index.nodeById.get(a.other);
      if (!edge?.since || !other) continue;
      items.push({ date: edge.since, label: edge.label, other, edgeId: edge.id, cls: other.kind });
    }
    items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return items;
  }, [index, node.id, visible]);

  const visibleStats = useMemo(() => {
    const sourceIds = new Set<string>();
    const evidenceIds = new Set<string>();
    const eventIds = new Set<string>();
    for (const adjacent of index.adjacency.get(node.id) ?? []) {
      if (!visible.edges.has(adjacent.edge)) continue;
      const edge = index.edgeById.get(adjacent.edge);
      const other = index.nodeById.get(adjacent.other);
      if (!edge) continue;
      edge.source_ids.forEach((id) => {
        if (index.payload.source_index[id]?.official) sourceIds.add(id);
      });
      edge.evidence_ids.forEach((id) => evidenceIds.add(id));
      edge.event_ids.forEach((id) => eventIds.add(id));
      if (other?.kind === "event" || other?.kind === "public_act") eventIds.add(other.id);
    }
    return {
      connections: connections.length,
      events: eventIds.size,
      officialSources: sourceIds.size,
      evidence: evidenceIds.size,
    };
  }, [connections.length, index, node.id, visible]);

  const expansionCounts = useMemo(() => {
    const first = neighborhood(index, node.id, 1, visible).nodes.size;
    const second = neighborhood(index, node.id, 2, visible).nodes.size;
    const third = neighborhood(index, node.id, 3, visible).nodes.size;
    return { second: Math.max(0, second - first), third: Math.max(0, third - second) };
  }, [index, node.id, visible]);

  const isAgent = node.kind === "person" || node.kind === "organization";
  const isEvent = node.kind === "event" || node.kind === "public_act";
  const participants = isEvent ? connections : [];
  const shown = showAll ? connections : connections.slice(0, 8);

  return (
    <PanelShell
      onClose={onClose}
      labelledBy="node-card-title"
      /*
        No celular o cabeçalho fica fixo enquanto a folha rola: mostrava a categoria em caixa alta
        e o leitor perdia de vista de quem se trata. O nome vem primeiro; a categoria fica ao lado.
      */
      title={
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="text-fg truncate text-sm font-semibold">{node.label}</span>
          <span className="text-fg-3 shrink-0 text-[10px] font-semibold tracking-[0.14em] uppercase">
            {NODE_CATEGORY_LABEL[node.category]}
          </span>
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

      {/*
        Estes números contam o que está visível agora, não o corpus inteiro — o dossiê conta o
        corpus. Sem dizer isso, o mesmo rótulo aparecia com dois valores diferentes, que é
        exatamente o tipo de divergência que um leitor cético usa para desacreditar o resto.
      */}
      <SectionHeading>Neste recorte do mapa</SectionHeading>
      <div className="grid grid-cols-4 gap-1.5">
        <Counter label="conexões" value={visibleStats.connections} title="Conexões visíveis com os filtros e o recorte temporal atuais. O dossiê traz o total do corpus." />
        <Counter label="eventos" value={visibleStats.events} title="Eventos alcançados pelas conexões visíveis." />
        <Counter label="fontes oficiais" value={visibleStats.officialSources} title="Fontes oficiais que sustentam as conexões visíveis." />
        <Counter label="evidências" value={visibleStats.evidence} title="Evidências ligadas às conexões visíveis." />
      </div>

      {/*
        Eram nove botões em três linhas antes de qualquer conteúdo: na folha inferior do celular
        sobrava espaço para duas conexões. Ficam três à mostra; o resto sai do caminho.
      */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {!node.href.startsWith("/grafo") && (
          <Link
            href={node.href}
            className="bg-accent text-bg inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold hover:opacity-90"
            data-testid="open-dossier"
          >
            Abrir dossiê completo
          </Link>
        )}
        <ToolButton
          active={focusDepth === 1}
          onClick={() => onFocus(focusDepth === 1 ? null : 1)}
          aria-label="Focar: mostrar só o primeiro grau"
        >
          Focar
        </ToolButton>
        <ToolButton
          active={focusDepth === 2}
          onClick={() => onFocus(focusDepth === 2 ? null : 2)}
          aria-label="Expandir para o segundo grau"
        >
          Expandir 2º grau (+{expansionCounts.second})
        </ToolButton>
      </div>

      <details className="mt-2">
        <summary className="text-fg-3 hover:text-fg cursor-pointer text-xs">Mais ações</summary>
        <div className="mt-2 flex flex-wrap gap-1.5">
        <ToolButton
          active={focusDepth === 3}
          onClick={() => onFocus(focusDepth === 3 ? 2 : 3)}
          aria-label="Expandir para o terceiro grau"
        >
          Expandir 3º grau (+{expansionCounts.third})
        </ToolButton>
        {focusDepth && (
          <ToolButton
            onClick={() => onFocus(focusDepth === 1 ? null : focusDepth === 3 ? 2 : 1)}
            aria-label="Recolher um grau"
          >
            Recolher
          </ToolButton>
        )}
        <ToolButton active={inSelection} onClick={onAddToSelection}>
          {inSelection ? "Na seleção" : "Adicionar à seleção"}
        </ToolButton>
        <ToolButton
          active={pinned}
          onClick={onTogglePinned}
          aria-label={pinned ? "Desafixar nó" : "Fixar nó no layout"}
        >
          {pinned ? "Desafixar" : "Fixar nó"}
        </ToolButton>
        <ToolButton onClick={onPathFrom}>Caminho até…</ToolButton>
        {isEvent && <ToolButton onClick={onBeforeAfter}>Antes / depois</ToolButton>}
        </div>
      </details>

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
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-accent mt-1.5 text-xs hover:underline"
        >
          {showAll ? "Mostrar menos" : `Mostrar todas (${connections.length})`}
        </button>
      )}

      {timeline.length > 0 && (
        <>
          <SectionHeading>Linha do tempo das conexões</SectionHeading>
          <ol className="border-border ml-1.5 border-l pl-3">
            {timeline.slice(0, 12).map((t) => (
              <li key={t.edgeId} className="relative mb-1.5 text-xs">
                <span
                  aria-hidden="true"
                  className="bg-fg-3 absolute top-1.5 -left-[15.5px] h-1.5 w-1.5 rounded-full"
                />
                <span className="text-fg-3 font-mono text-[11px] tabular-nums">
                  {formatDatePT(t.date)}
                </span>{" "}
                <span className="text-fg-2">{t.label}</span>{" "}
                <button
                  type="button"
                  onClick={() => onSelectNode(t.other.id)}
                  className="text-fg hover:underline"
                >
                  {t.other.label}
                </button>
              </li>
            ))}
            {timeline.length > 12 && (
              <li className="text-fg-3 text-[11px]">… e mais {timeline.length - 12}</li>
            )}
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
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: NODE_COLOR_FALLBACK[c.node.category] }}
            />
            <span className="text-fg min-w-0 flex-1 truncate text-xs">{c.node.label}</span>
            {/* shrink-0 e truncate se anulavam: rótulo longo empurrava a largura e criava rolagem horizontal. */}
            <span className="text-fg-3 max-w-[45%] min-w-0 truncate text-[10.5px]">
              {c.edgeLabel}
              {c.count > 1 && ` +${c.count - 1}`}
            </span>
            {/* Número nu não se explica: "74" ao lado de um nome não diz o que conta. */}
            <span
              className="text-fg-3 shrink-0 font-mono text-[10.5px] tabular-nums"
              title={`${c.node.degree} conexões no corpus`}
            >
              {c.node.degree} ↔
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
