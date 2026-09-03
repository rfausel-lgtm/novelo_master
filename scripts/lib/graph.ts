import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { circular } from "graphology-layout";
import type { Corpus } from "../../src/lib/schema";
import { OFFICIAL_SOURCE_TYPES, RELATIONSHIP_FAMILY } from "../../src/lib/schema";
import type {
  GraphEdge,
  GraphNode,
  GraphPayload,
  GraphStats,
  NodeCategory,
} from "../../src/lib/graph/types";

function minDate(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function orgCategory(orgType: string): NodeCategory {
  switch (orgType) {
    case "company":
    case "fund":
    case "law_firm":
      return "company";
    case "party":
      return "party";
    case "public_body":
    case "court":
      return "public_body";
    case "financial_institution":
      return "financial_institution";
    default:
      return "organization_other";
  }
}

export interface BuildGraphOptions {
  /** Executar ForceAtlas2 (desligar em testes rápidos). */
  layout?: boolean;
  iterations?: number;
  seed?: number;
}

/**
 * Constrói o payload do grafo a partir do corpus:
 *  - nós: pessoas, organizações, eventos e atos públicos (transações viram arestas);
 *  - arestas: relações (entidade↔entidade), participação (entidade→evento),
 *    atuação (entidade→ato público) e transações (from→to);
 *  - métricas por nó, flags official/documented por aresta, datas para a time machine;
 *  - posições via ForceAtlas2 determinístico (seed fixa).
 */
export function buildGraph(corpus: Corpus, opts: BuildGraphOptions = {}): GraphPayload {
  const layout = opts.layout ?? true;
  const iterations = opts.iterations ?? 600;

  const sources = new Map(corpus.sources.map((s) => [s.id, s]));
  const evidence = new Map(corpus.evidence.map((e) => [e.id, e]));
  const isOfficialSource = (id: string) => {
    const s = sources.get(id);
    return s ? OFFICIAL_SOURCE_TYPES.has(s.source_type) : false;
  };
  const expandSources = (evidenceIds: string[], sourceIds: string[]) => {
    const set = new Set(sourceIds);
    for (const eid of evidenceIds) evidence.get(eid)?.source_ids.forEach((s) => set.add(s));
    return [...set];
  };

  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const nodeHref = (kind: GraphNode["kind"], id: string) => {
    switch (kind) {
      case "person":
        return `/pessoas/${id}`;
      case "organization":
        return `/organizacoes/${id}`;
      case "event":
        return `/eventos/${id}`;
      case "public_act":
        return `/atos/${id}`;
      default:
        return `/grafo?n=${id}`;
    }
  };

  const addNode = (n: Omit<GraphNode, "degree" | "event_count" | "official_source_count" | "evidence_count" | "x" | "y" | "size" | "href">) => {
    nodes.set(n.id, {
      ...n,
      degree: 0,
      event_count: 0,
      official_source_count: 0,
      evidence_count: 0,
      x: 0,
      y: 0,
      size: 1,
      href: nodeHref(n.kind, n.id),
    });
  };

  for (const p of corpus.people) {
    addNode({
      id: p.id,
      kind: "person",
      category: "person",
      label: p.name,
      subtype: p.category,
      role: p.role,
      why: p.why_in_novelo,
      has_photo: !!p.photo,
    });
  }
  for (const o of corpus.organizations) {
    addNode({
      id: o.id,
      kind: "organization",
      category: orgCategory(o.org_type),
      label: o.name,
      subtype: o.org_type,
      why: o.why_in_novelo,
      has_photo: !!o.photo,
    });
  }
  for (const e of corpus.events) {
    addNode({
      id: e.id,
      kind: "event",
      category: "event",
      label: e.title,
      subtype: e.event_type,
      date: e.date,
      first_seen: e.date,
      has_photo: false,
    });
  }
  for (const a of corpus.public_acts) {
    addNode({
      id: a.id,
      kind: "public_act",
      category: "public_act",
      label: a.title,
      subtype: a.act_type,
      date: a.date,
      first_seen: a.date,
      has_photo: false,
    });
  }

  const eventDate = new Map(corpus.events.map((e) => [e.id, e.date]));
  const bump = (id: string, patch: Partial<Pick<GraphNode, "degree" | "event_count" | "official_source_count" | "evidence_count">>, since?: string) => {
    const n = nodes.get(id);
    if (!n) return;
    n.degree += patch.degree ?? 0;
    n.event_count += patch.event_count ?? 0;
    n.official_source_count += patch.official_source_count ?? 0;
    n.evidence_count += patch.evidence_count ?? 0;
    if (since) n.first_seen = minDate(n.first_seen, since);
  };

  /* Relações */
  for (const r of corpus.relationships) {
    if (!nodes.has(r.from_id) || !nodes.has(r.to_id)) continue;
    const allSources = expandSources(r.evidence_ids, r.source_ids);
    const official = allSources.some(isOfficialSource);
    const eventDates = r.event_ids.map((id) => eventDate.get(id)).filter(Boolean) as string[];
    const since = r.start_date ?? (eventDates.length ? eventDates.sort()[0] : undefined);
    const officialCount = allSources.filter(isOfficialSource).length;
    edges.push({
      id: r.id,
      source: r.from_id,
      target: r.to_id,
      kind: "relationship",
      relationship_type: r.relationship_type,
      family: RELATIONSHIP_FAMILY[r.relationship_type],
      label: r.label,
      evidence_class: r.evidence_class,
      status: r.status,
      confidence: r.confidence,
      directed: r.directed,
      start_date: r.start_date,
      end_date: r.end_date,
      since,
      official,
      documented: r.evidence_class === "D" || r.evidence_class === "C",
      source_ids: allSources,
      evidence_ids: r.evidence_ids,
      event_ids: r.event_ids,
      description: r.description,
      via_id: r.via_id,
    });
    bump(r.from_id, { degree: 1, official_source_count: officialCount, evidence_count: r.evidence_ids.length }, since);
    bump(r.to_id, { degree: 1, official_source_count: officialCount, evidence_count: r.evidence_ids.length }, since);
  }

  /* Participação em eventos */
  for (const e of corpus.events) {
    const allSources = expandSources(e.evidence_ids, e.source_ids);
    const official = allSources.some(isOfficialSource);
    const officialCount = allSources.filter(isOfficialSource).length;
    for (const pid of e.participant_ids) {
      if (!nodes.has(pid)) continue;
      edges.push({
        id: `part-${e.id}-${pid}`,
        source: pid,
        target: e.id,
        kind: "participation",
        relationship_type: "participation",
        family: "professional",
        label: "participa de",
        evidence_class: e.evidence_class,
        status: e.status,
        confidence: e.evidence_class === "D" ? 0.95 : e.evidence_class === "C" ? 0.8 : e.evidence_class === "A" ? 0.5 : 0.3,
        directed: true,
        since: e.date,
        official,
        documented: e.evidence_class === "D" || e.evidence_class === "C",
        source_ids: allSources,
        evidence_ids: e.evidence_ids,
        event_ids: [e.id],
        description: e.description,
      });
      bump(pid, { degree: 1, event_count: 1, official_source_count: officialCount, evidence_count: e.evidence_ids.length }, e.date);
      bump(e.id, { degree: 1 });
    }
    bump(e.id, { official_source_count: officialCount, evidence_count: e.evidence_ids.length });
  }

  /* Atores de atos públicos */
  for (const a of corpus.public_acts) {
    const allSources = expandSources(a.evidence_ids, a.source_ids);
    const official = allSources.some(isOfficialSource);
    const officialCount = allSources.filter(isOfficialSource).length;
    const actorIds = [...new Set([...a.actor_ids, ...(a.issuer_id ? [a.issuer_id] : [])])];
    for (const pid of actorIds) {
      if (!nodes.has(pid)) continue;
      edges.push({
        id: `actor-${a.id}-${pid}`,
        source: pid,
        target: a.id,
        kind: "actor",
        relationship_type: "actor",
        family: "institutional",
        label: pid === a.issuer_id ? "emite" : "atua em",
        evidence_class: a.evidence_class,
        status: a.status,
        confidence: a.evidence_class === "D" ? 0.95 : 0.7,
        directed: true,
        since: a.date,
        official,
        documented: a.evidence_class === "D" || a.evidence_class === "C",
        source_ids: allSources,
        evidence_ids: a.evidence_ids,
        event_ids: [],
        description: a.description,
      });
      bump(pid, { degree: 1, event_count: 1, official_source_count: officialCount, evidence_count: a.evidence_ids.length }, a.date);
      bump(a.id, { degree: 1 });
    }
    for (const pid of a.affected_ids) {
      if (!nodes.has(pid) || actorIds.includes(pid)) continue;
      edges.push({
        id: `affected-${a.id}-${pid}`,
        source: a.id,
        target: pid,
        kind: "actor",
        relationship_type: "actor",
        family: "institutional",
        label: "afeta",
        evidence_class: a.evidence_class,
        status: a.status,
        confidence: a.evidence_class === "D" ? 0.95 : 0.7,
        directed: true,
        since: a.date,
        official,
        documented: a.evidence_class === "D" || a.evidence_class === "C",
        source_ids: allSources,
        evidence_ids: a.evidence_ids,
        event_ids: [],
        description: a.description,
      });
      bump(pid, { degree: 1, event_count: 1, official_source_count: officialCount }, a.date);
      bump(a.id, { degree: 1 });
    }
    bump(a.id, { official_source_count: officialCount, evidence_count: a.evidence_ids.length });
  }

  /* Transações como arestas financeiras */
  for (const t of corpus.transactions) {
    if (!nodes.has(t.from_id) || !nodes.has(t.to_id)) continue;
    const allSources = expandSources(t.evidence_ids, t.source_ids);
    const official = allSources.some(isOfficialSource);
    edges.push({
      id: t.id,
      source: t.from_id,
      target: t.to_id,
      kind: "transaction",
      relationship_type: "transaction",
      family: "financial",
      label: t.amount_text ?? t.title,
      evidence_class: t.evidence_class,
      status: t.status,
      confidence: t.evidence_class === "D" ? 0.95 : t.evidence_class === "C" ? 0.8 : 0.5,
      directed: true,
      since: t.date,
      start_date: t.date,
      official,
      documented: t.evidence_class === "D" || t.evidence_class === "C",
      source_ids: allSources,
      evidence_ids: t.evidence_ids,
      event_ids: t.event_ids,
      description: t.description,
    });
    bump(t.from_id, { degree: 1, evidence_count: t.evidence_ids.length }, t.date);
    bump(t.to_id, { degree: 1, evidence_count: t.evidence_ids.length }, t.date);
  }

  /* Tamanho dos nós: escala log do grau, eventos menores. */
  for (const n of nodes.values()) {
    const base = n.kind === "person" || n.kind === "organization" ? 2.6 : 1.8;
    n.size = base + Math.log2(1 + n.degree) * 1.4;
  }

  /* Layout */
  const g = new Graph({ multi: true, type: "mixed" });
  for (const n of nodes.values()) g.addNode(n.id, { size: n.size });
  for (const e of edges) {
    if (e.directed) g.addDirectedEdgeWithKey(e.id, e.source, e.target, { weight: 1 });
    else g.addUndirectedEdgeWithKey(e.id, e.source, e.target, { weight: 1 });
  }
  if (g.order > 0) {
    circular.assign(g, { scale: 100 });
    // Perturbação determinística para evitar simetrias perfeitas.
    let seed = opts.seed ?? 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    g.forEachNode((id) => {
      g.setNodeAttribute(id, "x", g.getNodeAttribute(id, "x") + (rand() - 0.5) * 20);
      g.setNodeAttribute(id, "y", g.getNodeAttribute(id, "y") + (rand() - 0.5) * 20);
    });
    if (layout) {
      const settings = forceAtlas2.inferSettings(g);
      forceAtlas2.assign(g, {
        iterations,
        settings: { ...settings, gravity: 1, scalingRatio: 6, barnesHutOptimize: g.order > 800 },
      });
    }
    g.forEachNode((id, attrs) => {
      const n = nodes.get(id)!;
      n.x = Number(attrs.x.toFixed(2));
      n.y = Number(attrs.y.toFixed(2));
    });
  }

  const dates = [
    ...corpus.events.map((e) => e.date),
    ...corpus.public_acts.map((a) => a.date),
    ...corpus.transactions.map((t) => t.date),
    ...corpus.relationships.map((r) => r.start_date).filter(Boolean),
  ].filter(Boolean) as string[];
  dates.sort();

  const stats: GraphStats = {
    people: corpus.people.length,
    organizations: corpus.organizations.length,
    events: corpus.events.length,
    public_acts: corpus.public_acts.length,
    transactions: corpus.transactions.length,
    documents: corpus.documents.length,
    sources: corpus.sources.length,
    official_sources: corpus.sources.filter((s) => OFFICIAL_SOURCE_TYPES.has(s.source_type)).length,
    evidence: corpus.evidence.length,
    relationships: corpus.relationships.length,
    claims: corpus.claims.length,
    nodes: nodes.size,
    edges: edges.length,
    min_date: dates[0],
    max_date: dates[dates.length - 1],
  };

  return {
    version: 1,
    built_at: corpus.built_at,
    stats,
    nodes: [...nodes.values()],
    edges,
  };
}
