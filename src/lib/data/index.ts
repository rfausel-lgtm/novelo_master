/**
 * Acesso ao corpus compilado (src/generated/corpus.json), usado pelas páginas
 * pré-renderizadas. Server-only: nunca importar em componentes "use client".
 */
import corpusJson from "@/generated/corpus.json";
import statsJson from "@/generated/stats.json";
import type {
  Corpus,
  Person,
  Organization,
  Event,
  PublicAct,
  Transaction,
  Relationship,
  Claim,
  Source,
  Document,
  Evidence,
  TemporalSequence,
  Revision,
  EntityRecord,
} from "@/lib/schema";
import { OFFICIAL_SOURCE_TYPES } from "@/lib/schema";
import type { GraphStats } from "@/lib/graph/types";

export const corpus = corpusJson as unknown as Corpus;
export const stats = statsJson as GraphStats;

function indexBy<T extends { id: string }>(arr: T[]): Map<string, T> {
  return new Map(arr.map((r) => [r.id, r]));
}

const people = indexBy(corpus.people);
const organizations = indexBy(corpus.organizations);
const events = indexBy(corpus.events);
const publicActs = indexBy(corpus.public_acts);
const transactions = indexBy(corpus.transactions);
const relationships = indexBy(corpus.relationships);
const claims = indexBy(corpus.claims);
const sources = indexBy(corpus.sources);
const documents = indexBy(corpus.documents);
const evidence = indexBy(corpus.evidence);
const sequences = indexBy(corpus.sequences);

export const getPerson = (id: string): Person | undefined => people.get(id);
export const getOrganization = (id: string): Organization | undefined => organizations.get(id);
export const getEntity = (id: string): EntityRecord | undefined =>
  people.get(id) ?? organizations.get(id);
export const getEvent = (id: string): Event | undefined => events.get(id);
export const getPublicAct = (id: string): PublicAct | undefined => publicActs.get(id);
export const getTransaction = (id: string): Transaction | undefined => transactions.get(id);
export const getRelationship = (id: string): Relationship | undefined => relationships.get(id);
export const getClaim = (id: string): Claim | undefined => claims.get(id);
export const getSource = (id: string): Source | undefined => sources.get(id);
export const getDocument = (id: string): Document | undefined => documents.get(id);
export const getEvidence = (id: string): Evidence | undefined => evidence.get(id);
export const getSequence = (id: string): TemporalSequence | undefined => sequences.get(id);

export const allPeople = (): Person[] =>
  [...corpus.people].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
export const allOrganizations = (): Organization[] =>
  [...corpus.organizations].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
export const allEvents = (): Event[] =>
  [...corpus.events].sort((a, b) => a.date.localeCompare(b.date));
export const allPublicActs = (): PublicAct[] =>
  [...corpus.public_acts].sort((a, b) => a.date.localeCompare(b.date));
export const allTransactions = (): Transaction[] =>
  [...corpus.transactions].sort((a, b) => a.date.localeCompare(b.date));
export const allRelationships = (): Relationship[] => corpus.relationships;
export const allClaims = (): Claim[] => corpus.claims;
export const allSources = (): Source[] =>
  [...corpus.sources].sort((a, b) =>
    (b.publication_date ?? "").localeCompare(a.publication_date ?? ""),
  );
export const allDocuments = (): Document[] =>
  [...corpus.documents].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
export const allEvidence = (): Evidence[] => corpus.evidence;
export const allSequences = (): TemporalSequence[] => corpus.sequences;
/*
 * Ordem das revisões: `date` é a data editorial do que a revisão cobre, e hoje as 70 revisões do
 * corpus compartilham a mesma — ordenar só por ela deixava o desempate por ordem de leitura do
 * disco, e a página de atualizações abria num lote do meio. O id (`rev-<data>-lote-<n>-<slug>`)
 * carrega a sequência real, então o desempate é por ele, em ordem natural: `lote-70` depois de
 * `lote-7`, que a comparação de texto inverteria.
 */
const NATURAL = new Intl.Collator("pt-BR", { numeric: true });
export const allRevisions = (): Revision[] =>
  [...corpus.revisions].sort((a, b) => b.date.localeCompare(a.date) || NATURAL.compare(b.id, a.id));

export const isOfficialSource = (s: Source): boolean => OFFICIAL_SOURCE_TYPES.has(s.source_type);

/** Entidade → href da página individual. */
export function entityHref(id: string): string {
  if (people.has(id)) return `/pessoas/${id}`;
  if (organizations.has(id)) return `/organizacoes/${id}`;
  if (events.has(id)) return `/eventos/${id}`;
  if (publicActs.has(id)) return `/atos/${id}`;
  if (documents.has(id)) return `/documentos/${id}`;
  if (sources.has(id)) return `/fontes/${id}`;
  return `/grafo?n=${id}`;
}

export function entityName(id: string): string {
  return (
    people.get(id)?.name ??
    organizations.get(id)?.name ??
    events.get(id)?.title ??
    publicActs.get(id)?.title ??
    documents.get(id)?.title ??
    sources.get(id)?.title ??
    id
  );
}

/* ------------------------------------------------------------------ */
/* Relações derivadas por entidade                                     */
/* ------------------------------------------------------------------ */

export function relationshipsOf(entityId: string): Relationship[] {
  return corpus.relationships.filter(
    (r) => r.from_id === entityId || r.to_id === entityId || r.via_id === entityId,
  );
}

export function eventsOf(entityId: string): Event[] {
  const viaRel = new Set(relationshipsOf(entityId).flatMap((r) => r.event_ids));
  return allEvents().filter((e) => e.participant_ids.includes(entityId) || viaRel.has(e.id));
}

export function publicActsOf(entityId: string): PublicAct[] {
  return allPublicActs().filter(
    (a) =>
      a.actor_ids.includes(entityId) ||
      a.affected_ids.includes(entityId) ||
      a.issuer_id === entityId,
  );
}

export function transactionsOf(entityId: string): Transaction[] {
  return allTransactions().filter((t) => t.from_id === entityId || t.to_id === entityId);
}

export function claimsOf(entityId: string): Claim[] {
  return corpus.claims.filter(
    (c) => c.related_entity_ids.includes(entityId) || c.claimant_id === entityId,
  );
}

/** Todas as evidências ligadas a uma entidade (via relações, eventos, atos, transações, claims). */
export function evidenceOf(entityId: string): Evidence[] {
  const ids = new Set<string>();
  relationshipsOf(entityId).forEach((r) => r.evidence_ids.forEach((id) => ids.add(id)));
  eventsOf(entityId).forEach((e) => e.evidence_ids.forEach((id) => ids.add(id)));
  publicActsOf(entityId).forEach((a) => a.evidence_ids.forEach((id) => ids.add(id)));
  transactionsOf(entityId).forEach((t) => t.evidence_ids.forEach((id) => ids.add(id)));
  claimsOf(entityId).forEach((c) => c.evidence_ids.forEach((id) => ids.add(id)));
  return [...ids].map((id) => evidence.get(id)).filter((e): e is Evidence => !!e);
}

/** Todas as fontes ligadas a uma entidade (diretas + via evidências/relações/eventos). */
export function sourcesOf(entityId: string): Source[] {
  const ids = new Set<string>();
  const ent = getEntity(entityId);
  ent?.source_ids.forEach((id) => ids.add(id));
  ent?.cited_position.forEach((cp) => cp.source_ids.forEach((id) => ids.add(id)));
  relationshipsOf(entityId).forEach((r) => r.source_ids.forEach((id) => ids.add(id)));
  eventsOf(entityId).forEach((e) => e.source_ids.forEach((id) => ids.add(id)));
  publicActsOf(entityId).forEach((a) => a.source_ids.forEach((id) => ids.add(id)));
  transactionsOf(entityId).forEach((t) => t.source_ids.forEach((id) => ids.add(id)));
  evidenceOf(entityId).forEach((e) => e.source_ids.forEach((id) => ids.add(id)));
  return [...ids].map((id) => sources.get(id)).filter((s): s is Source => !!s);
}

export function documentsOf(entityId: string): Document[] {
  const ids = new Set<string>();
  corpus.documents
    .filter((d) => d.related_entity_ids.includes(entityId) || d.issuer_id === entityId)
    .forEach((d) => ids.add(d.id));
  relationshipsOf(entityId).forEach((r) => r.document_ids.forEach((id) => ids.add(id)));
  eventsOf(entityId).forEach((e) => e.document_ids.forEach((id) => ids.add(id)));
  publicActsOf(entityId).forEach((a) => a.document_ids.forEach((id) => ids.add(id)));
  evidenceOf(entityId).forEach((e) => e.document_ids.forEach((id) => ids.add(id)));
  return [...ids].map((id) => documents.get(id)).filter((d): d is Document => !!d);
}

/** Conexões diretas (outra ponta de cada relação), com a relação que as sustenta. */
export function connectionsOf(
  entityId: string,
): { entity: EntityRecord; relationship: Relationship }[] {
  const out: { entity: EntityRecord; relationship: Relationship }[] = [];
  for (const r of relationshipsOf(entityId)) {
    const otherId = r.from_id === entityId ? r.to_id : r.from_id;
    const other = getEntity(otherId);
    if (other) out.push({ entity: other, relationship: r });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Derivadas por fonte / documento / evidência                         */
/* ------------------------------------------------------------------ */

export function usagesOfSource(sourceId: string) {
  const inEvidence = corpus.evidence.filter((e) => e.source_ids.includes(sourceId));
  const evidenceIds = new Set(inEvidence.map((e) => e.id));
  const uses = (ids: string[], evIds: string[]) =>
    ids.includes(sourceId) || evIds.some((id) => evidenceIds.has(id));
  return {
    evidence: inEvidence,
    documents: corpus.documents.filter((d) => d.source_ids.includes(sourceId)),
    events: corpus.events.filter((e) => uses(e.source_ids, e.evidence_ids)),
    publicActs: corpus.public_acts.filter((a) => uses(a.source_ids, a.evidence_ids)),
    transactions: corpus.transactions.filter((t) => uses(t.source_ids, t.evidence_ids)),
    relationships: corpus.relationships.filter((r) => uses(r.source_ids, r.evidence_ids)),
    claims: corpus.claims.filter((c) => uses(c.source_ids, c.evidence_ids)),
    people: corpus.people.filter(
      (p) =>
        p.source_ids.includes(sourceId) ||
        p.cited_position.some((cp) => cp.source_ids.includes(sourceId)),
    ),
    organizations: corpus.organizations.filter(
      (o) =>
        o.source_ids.includes(sourceId) ||
        o.cited_position.some((cp) => cp.source_ids.includes(sourceId)),
    ),
  };
}

export function usagesOfDocument(documentId: string) {
  const inEvidence = corpus.evidence.filter((e) => e.document_ids.includes(documentId));
  const evidenceIds = new Set(inEvidence.map((e) => e.id));
  const uses = (ids: string[], evIds: string[]) =>
    ids.includes(documentId) || evIds.some((id) => evidenceIds.has(id));
  return {
    evidence: inEvidence,
    events: corpus.events.filter((e) => uses(e.document_ids, e.evidence_ids)),
    publicActs: corpus.public_acts.filter((a) => uses(a.document_ids, a.evidence_ids)),
    transactions: corpus.transactions.filter((t) => uses(t.document_ids, t.evidence_ids)),
    relationships: corpus.relationships.filter((r) => uses(r.document_ids, r.evidence_ids)),
  };
}

/** Participantes de um evento com nomes resolvidos. */
export function participantsOf(event: Event): EntityRecord[] {
  return event.participant_ids.map(getEntity).filter((e): e is EntityRecord => !!e);
}

/** Última atualização do corpus (maior updated_at entre todos os registros). */
export function lastUpdated(): string {
  const all: { updated_at?: string; date?: string }[] = [
    ...corpus.people,
    ...corpus.organizations,
    ...corpus.events,
    ...corpus.relationships,
    ...corpus.sources,
    ...corpus.documents,
    ...corpus.evidence,
    ...corpus.public_acts,
    ...corpus.transactions,
    ...corpus.claims,
  ];
  const dates = all
    .map((r) => r.updated_at ?? "")
    .filter(Boolean)
    .sort();
  return dates[dates.length - 1] ?? corpus.built_at.slice(0, 10);
}
