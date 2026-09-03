/**
 * Helpers de página (server-only): metadados, JSON-LD, ordenação por classe de
 * evidência, linha do tempo unificada e vizinhança temporal ("antes e depois").
 */
import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import {
  corpus,
  entityHref,
  entityName,
  getSource,
  isOfficialSource,
  allEvents,
  allPublicActs,
  allTransactions,
} from "@/lib/data";
import { daysBetween } from "@/lib/format";
import {
  EVENT_TYPE_LABEL,
  PUBLIC_ACT_TYPE_LABEL,
  TRANSACTION_TYPE_LABEL,
  type EvidenceClass,
  type Event,
  type PublicAct,
  type Transaction,
  type Source,
} from "@/lib/schema";

/* ------------------------------------------------------------------ */
/* Metadados                                                           */
/* ------------------------------------------------------------------ */

export function pageMetadata(opts: { title: string; description: string; path: string; type?: "website" | "article" }): Metadata {
  const url = `${SITE.url}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: opts.type ?? "article",
      url,
      title: opts.title,
      description: opts.description,
      siteName: SITE.name,
      locale: "pt_BR",
    },
  };
}

/** Corta um texto para uso em description (sem quebrar palavras). */
export function excerptOf(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 80))}...`;
}

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path}`;
}

/* ------------------------------------------------------------------ */
/* Evidência                                                           */
/* ------------------------------------------------------------------ */

export const EVIDENCE_RANK: Record<EvidenceClass, number> = { D: 0, C: 1, A: 2, I: 3 };

export function byEvidenceThenName<T>(cls: (t: T) => EvidenceClass, name: (t: T) => string) {
  return (a: T, b: T) => EVIDENCE_RANK[cls(a)] - EVIDENCE_RANK[cls(b)] || name(a).localeCompare(name(b), "pt-BR");
}

export function officialCount(sources: Source[]): number {
  return sources.filter(isOfficialSource).length;
}

export function sourcesByIds(ids: string[]): Source[] {
  return ids.map(getSource).filter((s): s is Source => !!s);
}

/* ------------------------------------------------------------------ */
/* Linha do tempo unificada                                            */
/* ------------------------------------------------------------------ */

export type TimelineKind = "event" | "public_act" | "transaction";

export interface TimelineItem {
  id: string;
  kind: TimelineKind;
  kindLabel: string;
  date: string;
  datePrecision: string;
  endDate?: string;
  title: string;
  typeLabel: string;
  description: string;
  evidenceClass: EvidenceClass;
  status: Event["status"];
  href: string;
  /** Agentes envolvidos (participantes, atores, partes). */
  agents: { id: string; name: string; href: string }[];
  sourceIds: string[];
  firstSourceTitle?: string;
  sourceCount: number;
  location?: string;
}

const KIND_LABEL: Record<TimelineKind, string> = {
  event: "Evento",
  public_act: "Ato público",
  transaction: "Transação",
};

function agentsOf(ids: string[]) {
  const seen = new Set<string>();
  return ids
    .filter((id) => (seen.has(id) ? false : (seen.add(id), true)))
    .map((id) => ({ id, name: entityName(id), href: entityHref(id) }));
}

function firstSourceTitle(ids: string[]): string | undefined {
  for (const id of ids) {
    const s = getSource(id);
    if (s) return s.title;
  }
  return undefined;
}

export function eventToTimeline(e: Event): TimelineItem {
  return {
    id: e.id,
    kind: "event",
    kindLabel: KIND_LABEL.event,
    date: e.date,
    datePrecision: e.date_precision,
    endDate: e.end_date,
    title: e.title,
    typeLabel: EVENT_TYPE_LABEL[e.event_type],
    description: e.description,
    evidenceClass: e.evidence_class,
    status: e.status,
    href: `/eventos/${e.id}`,
    agents: agentsOf(e.participant_ids),
    sourceIds: e.source_ids,
    firstSourceTitle: firstSourceTitle(e.source_ids),
    sourceCount: e.source_ids.length,
    location: e.location,
  };
}

export function publicActToTimeline(a: PublicAct): TimelineItem {
  return {
    id: a.id,
    kind: "public_act",
    kindLabel: KIND_LABEL.public_act,
    date: a.date,
    datePrecision: a.date_precision,
    title: a.title,
    typeLabel: PUBLIC_ACT_TYPE_LABEL[a.act_type],
    description: a.description,
    evidenceClass: a.evidence_class,
    status: a.status,
    href: `/atos/${a.id}`,
    agents: agentsOf([...(a.issuer_id ? [a.issuer_id] : []), ...a.actor_ids, ...a.affected_ids]),
    sourceIds: a.source_ids,
    firstSourceTitle: firstSourceTitle(a.source_ids),
    sourceCount: a.source_ids.length,
  };
}

export function transactionToTimeline(t: Transaction): TimelineItem {
  return {
    id: t.id,
    kind: "transaction",
    kindLabel: KIND_LABEL.transaction,
    date: t.date,
    datePrecision: t.date_precision,
    title: t.title,
    typeLabel: TRANSACTION_TYPE_LABEL[t.transaction_type],
    description: t.description,
    evidenceClass: t.evidence_class,
    status: t.status,
    href: `/grafo?n=${t.id}`,
    agents: agentsOf([t.from_id, t.to_id]),
    sourceIds: t.source_ids,
    firstSourceTitle: firstSourceTitle(t.source_ids),
    sourceCount: t.source_ids.length,
  };
}

export function sortTimeline(items: TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "pt-BR"));
}

/** Toda a cronologia do corpus (eventos + atos + transações), ordenada. */
export function fullTimeline(): TimelineItem[] {
  return sortTimeline([
    ...allEvents().map(eventToTimeline),
    ...allPublicActs().map(publicActToTimeline),
    ...allTransactions().map(transactionToTimeline),
  ]);
}

/** Linha do tempo de uma entidade (eventos + atos + transações em que aparece). */
export function timelineOf(events: Event[], acts: PublicAct[], transactions: Transaction[] = []): TimelineItem[] {
  return sortTimeline([
    ...events.map(eventToTimeline),
    ...acts.map(publicActToTimeline),
    ...transactions.map(transactionToTimeline),
  ]);
}

/* ------------------------------------------------------------------ */
/* Antes e depois                                                      */
/* ------------------------------------------------------------------ */

export type Window = 7 | 30 | 90;

export interface NearbyItem {
  item: TimelineItem;
  /** Dias em relação ao item de referência (negativo = antes). */
  delta: number;
  window: Window;
}

export interface Nearby {
  before: NearbyItem[];
  after: NearbyItem[];
  /** Mesmo dia (delta 0), exceto o próprio item. */
  same: TimelineItem[];
}

function windowOf(abs: number): Window | null {
  if (abs <= 7) return 7;
  if (abs <= 30) return 30;
  if (abs <= 90) return 90;
  return null;
}

/** Eventos, atos e transações até 90 dias antes/depois de `date`, excluindo `selfId`. */
export function nearbyOf(selfId: string, date: string): Nearby {
  const before: NearbyItem[] = [];
  const after: NearbyItem[] = [];
  const same: TimelineItem[] = [];
  for (const item of fullTimeline()) {
    if (item.id === selfId) continue;
    const delta = daysBetween(date, item.date);
    if (delta === 0) {
      same.push(item);
      continue;
    }
    const w = windowOf(Math.abs(delta));
    if (!w) continue;
    (delta < 0 ? before : after).push({ item, delta, window: w });
  }
  before.sort((a, b) => b.delta - a.delta); // mais próximo primeiro
  after.sort((a, b) => a.delta - b.delta);
  return { before, after, same };
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                             */
/* ------------------------------------------------------------------ */

export function personJsonLd(p: { id: string; name: string; full_name?: string; role: string; summary: string; aliases: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    alternateName: [p.full_name, ...p.aliases].filter(Boolean),
    jobTitle: p.role,
    description: p.summary,
    url: absoluteUrl(`/pessoas/${p.id}`),
  };
}

export function organizationJsonLd(o: { id: string; name: string; full_name?: string; summary: string; aliases: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: o.name,
    alternateName: [o.full_name, ...o.aliases].filter(Boolean),
    description: o.summary,
    url: absoluteUrl(`/organizacoes/${o.id}`),
  };
}

export function eventJsonLd(e: Event) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: e.date,
    endDate: e.end_date,
    description: e.description,
    location: e.location ? { "@type": "Place", name: e.location } : undefined,
    url: absoluteUrl(`/eventos/${e.id}`),
  };
}

export function articleJsonLd(opts: { title: string; description: string; path: string; dateModified?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: absoluteUrl(opts.path),
    dateModified: opts.dateModified,
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    inLanguage: "pt-BR",
  };
}

/** Todas as datas de atualização conhecidas, para sitemap. */
export function corpusDate(): string {
  return corpus.built_at;
}
