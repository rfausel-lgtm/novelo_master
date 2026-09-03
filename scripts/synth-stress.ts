/**
 * Gera datasets SINTÉTICOS (nomes claramente fictícios) conformes ao contrato
 * GraphPayload, para desenvolver e estressar o grafo enquanto o corpus real
 * é pesquisado:
 *
 *   public/data/graph-stress.json  ~5.000 nós / 25.000 arestas
 *   public/data/graph-demo.json    ~120 nós / 400 arestas
 *
 * Uso: npm run data:stress  (ou `tsx scripts/synth-stress.ts --demo-only`)
 *
 * Nenhum nome real: rótulos são "Pessoa Exemplo N", "Empresa Exemplo N" etc.
 */
import fs from "node:fs";
import path from "node:path";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { random } from "graphology-layout";
import type {
  EvidenceClass,
  FactStatus,
  RelationshipFamily,
  RelationshipType,
} from "../src/lib/schema";
import { RELATIONSHIP_FAMILY, RELATIONSHIP_TYPE_LABEL } from "../src/lib/schema";
import type {
  GraphEdge,
  GraphNode,
  GraphPayload,
  GraphStats,
  NodeCategory,
} from "../src/lib/graph/types";

/* ------------------------------------------------------------------ */
/* PRNG determinístico                                                  */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function weighted<T extends string>(rng: Rng, table: Record<T, number>): T {
  const entries = Object.entries(table) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

/* ------------------------------------------------------------------ */
/* Datas                                                                */
/* ------------------------------------------------------------------ */

const MIN_DATE = Date.UTC(2018, 0, 1);
const MAX_DATE = Date.UTC(2026, 8, 1);

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Datas com viés para os anos recentes (mais registros perto do fim). */
function randomDate(rng: Rng): string {
  const t = Math.pow(rng(), 0.7);
  return isoDate(MIN_DATE + t * (MAX_DATE - MIN_DATE));
}

/* ------------------------------------------------------------------ */
/* Vocabulário PT-BR                                                    */
/* ------------------------------------------------------------------ */

const PERSON_SUBTYPES = [
  "banker",
  "businessperson",
  "politician",
  "judge",
  "prosecutor",
  "police",
  "lawyer",
  "public_official",
  "executive",
  "journalist",
  "family",
  "other",
] as const;

const PERSON_ROLE: Record<(typeof PERSON_SUBTYPES)[number], string> = {
  banker: "Controlador de instituição financeira (exemplo)",
  businessperson: "Empresário (exemplo)",
  politician: "Parlamentar (exemplo)",
  judge: "Magistrado (exemplo)",
  prosecutor: "Procurador (exemplo)",
  police: "Delegado (exemplo)",
  lawyer: "Advogado (exemplo)",
  public_official: "Servidor público (exemplo)",
  executive: "Diretor executivo (exemplo)",
  journalist: "Jornalista (exemplo)",
  family: "Familiar (exemplo)",
  other: "Outro (exemplo)",
};

const ORG_CATEGORY_WEIGHTS: Record<
  Exclude<NodeCategory, "person" | "event" | "public_act" | "transaction">,
  number
> = {
  company: 55,
  financial_institution: 15,
  public_body: 15,
  party: 5,
  organization_other: 10,
};

const ORG_LABEL_PREFIX: Record<keyof typeof ORG_CATEGORY_WEIGHTS, [string, string]> = {
  company: ["Empresa Exemplo", "company"],
  financial_institution: ["Instituição Financeira Exemplo", "financial_institution"],
  public_body: ["Órgão Público Exemplo", "public_body"],
  party: ["Partido Exemplo", "party"],
  organization_other: ["Associação Exemplo", "association"],
};

const EVENT_SUBTYPES = [
  "meeting",
  "communication",
  "travel",
  "payment",
  "corporate_act",
  "judicial_decision",
  "investigation_step",
  "regulatory_act",
  "publication",
  "statement",
  "appointment",
  "social_event",
] as const;

const EVENT_TITLE: Record<(typeof EVENT_SUBTYPES)[number], string> = {
  meeting: "Reunião exemplo",
  communication: "Comunicação exemplo",
  travel: "Viagem exemplo",
  payment: "Pagamento exemplo",
  corporate_act: "Ato societário exemplo",
  judicial_decision: "Decisão judicial exemplo",
  investigation_step: "Ato de investigação exemplo",
  regulatory_act: "Ato regulatório exemplo",
  publication: "Publicação exemplo",
  statement: "Declaração exemplo",
  appointment: "Nomeação exemplo",
  social_event: "Evento social exemplo",
};

const ACT_SUBTYPES = ["legislative", "judicial", "administrative", "regulatory", "executive"] as const;
const ACT_TITLE: Record<(typeof ACT_SUBTYPES)[number], string> = {
  legislative: "Ato legislativo exemplo",
  judicial: "Ato judicial exemplo",
  administrative: "Ato administrativo exemplo",
  regulatory: "Ato regulatório exemplo",
  executive: "Ato executivo exemplo",
};

const REL_TYPES: RelationshipType[] = [
  "personal_social",
  "familial",
  "professional",
  "political",
  "institutional",
  "financial",
  "commercial",
  "corporate",
  "contractual",
  "shared_event",
  "intermediary",
  "communication",
  "investigative_allegation",
];

const REL_LABEL: Record<RelationshipType, string[]> = {
  personal_social: ["amigo de", "convívio social"],
  familial: ["parente de", "cônjuge de"],
  professional: ["colega de", "trabalhou com"],
  political: ["aliado político de", "apoiou campanha de"],
  institutional: ["vínculo institucional com", "representa"],
  financial: ["credor de", "financiou"],
  commercial: ["cliente de", "fornecedor de"],
  corporate: ["sócio de", "administrador de"],
  contractual: ["contratou", "contrato com"],
  shared_event: ["presente no mesmo evento que"],
  intermediary: ["intermediou contato com"],
  communication: ["trocou mensagens com", "telefonou para"],
  investigative_allegation: ["citado em alegação junto a"],
};

const EVIDENCE_WEIGHTS: Record<EvidenceClass, number> = { D: 35, C: 30, A: 25, I: 10 };
const OFFICIAL_PROB: Record<EvidenceClass, number> = { D: 0.85, C: 0.5, A: 0.2, I: 0.05 };
const STATUS_BY_CLASS: Record<EvidenceClass, Record<FactStatus, number>> = {
  D: { verified: 85, disputed: 5, unverified: 10, refuted: 0 },
  C: { verified: 60, disputed: 10, unverified: 30, refuted: 0 },
  A: { verified: 10, disputed: 25, unverified: 60, refuted: 5 },
  I: { verified: 0, disputed: 20, unverified: 75, refuted: 5 },
};
const CONFIDENCE_BASE: Record<EvidenceClass, number> = { D: 0.9, C: 0.75, A: 0.45, I: 0.3 };

/* ------------------------------------------------------------------ */
/* Geração                                                              */
/* ------------------------------------------------------------------ */

interface SynthOptions {
  nodes: number;
  edges: number;
  seed: number;
  iterations: number;
}

type Bare = Omit<
  GraphNode,
  "degree" | "event_count" | "official_source_count" | "evidence_count" | "x" | "y" | "size"
>;

function synth(opts: SynthOptions): GraphPayload {
  const rng = mulberry32(opts.seed);

  const nPeople = Math.round(opts.nodes * 0.6);
  const nOrgs = Math.round(opts.nodes * 0.25);
  const nEvents = Math.round(opts.nodes * 0.1);
  const nActs = opts.nodes - nPeople - nOrgs - nEvents;

  const nodes: Bare[] = [];
  const people: string[] = [];
  const orgs: string[] = [];
  const events: string[] = [];
  const acts: string[] = [];
  const eventDate = new Map<string, string>();

  for (let i = 1; i <= nPeople; i++) {
    const id = `px-${i}`;
    const subtype = pick(rng, PERSON_SUBTYPES);
    people.push(id);
    nodes.push({
      id,
      kind: "person",
      category: "person",
      label: `Pessoa Exemplo ${i}`,
      subtype,
      role: PERSON_ROLE[subtype],
      why: "Nó sintético gerado para teste de carga; não corresponde a pessoa real.",
      has_photo: false,
      href: `/pessoas/${id}`,
    });
  }
  for (let i = 1; i <= nOrgs; i++) {
    const category = weighted(rng, ORG_CATEGORY_WEIGHTS);
    const [prefix, subtype] = ORG_LABEL_PREFIX[category];
    const id = `ox-${i}`;
    orgs.push(id);
    nodes.push({
      id,
      kind: "organization",
      category,
      label: `${prefix} ${i}`,
      subtype,
      why: "Organização sintética gerada para teste; não corresponde a entidade real.",
      has_photo: false,
      href: `/organizacoes/${id}`,
    });
  }
  for (let i = 1; i <= nEvents; i++) {
    const subtype = pick(rng, EVENT_SUBTYPES);
    const id = `ex-${i}`;
    const date = randomDate(rng);
    events.push(id);
    eventDate.set(id, date);
    nodes.push({
      id,
      kind: "event",
      category: "event",
      label: `${EVENT_TITLE[subtype]} ${i}`,
      subtype,
      date,
      first_seen: date,
      has_photo: false,
      href: `/eventos/${id}`,
    });
  }
  for (let i = 1; i <= nActs; i++) {
    const subtype = pick(rng, ACT_SUBTYPES);
    const id = `ax-${i}`;
    const date = randomDate(rng);
    acts.push(id);
    eventDate.set(id, date);
    nodes.push({
      id,
      kind: "public_act",
      category: "public_act",
      label: `${ACT_TITLE[subtype]} ${i}`,
      subtype,
      date,
      first_seen: date,
      has_photo: false,
      href: `/atos/${id}`,
    });
  }

  /* Amostragem livre de escala: peso ~ Zipf sobre agentes (pessoas + orgs). */
  const agents = [...people, ...orgs];
  const weights = agents.map((_, i) => 1 / Math.pow(i + 1, 0.72));
  // embaralha para não concentrar hubs nos primeiros ids
  for (let i = weights.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [weights[i], weights[j]] = [weights[j], weights[i]];
  }
  const cumulative: number[] = [];
  let acc = 0;
  for (const w of weights) {
    acc += w;
    cumulative.push(acc);
  }
  const sampleAgent = (): string => {
    const r = rng() * acc;
    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    return agents[lo];
  };

  const edges: GraphEdge[] = [];
  const seenPairs = new Set<string>();
  let srcCounter = 0;
  const sources = (cls: EvidenceClass, official: boolean): string[] => {
    const n = cls === "C" ? 2 + (rng() < 0.5 ? 1 : 0) : 1;
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      srcCounter++;
      out.push(official && i === 0 ? `fonte-oficial-${srcCounter}` : `fonte-${srcCounter}`);
    }
    return out;
  };
  const evidences = (cls: EvidenceClass): string[] =>
    cls === "I" ? [] : [`ev-${edges.length + 1}`];

  const EDGE_KIND_WEIGHTS = { relationship: 60, participation: 25, actor: 10, transaction: 5 } as const;

  let guard = 0;
  while (edges.length < opts.edges && guard++ < opts.edges * 20) {
    const kind = weighted(rng, EDGE_KIND_WEIGHTS);
    const cls = weighted(rng, EVIDENCE_WEIGHTS);
    const official = rng() < OFFICIAL_PROB[cls];
    const status = weighted(rng, STATUS_BY_CLASS[cls]);
    const confidence = Number(Math.min(1, Math.max(0.05, CONFIDENCE_BASE[cls] + (rng() - 0.5) * 0.2)).toFixed(2));
    const base = {
      evidence_class: cls,
      status,
      confidence,
      official,
      documented: cls === "D" || cls === "C",
      source_ids: sources(cls, official),
      evidence_ids: evidences(cls),
    };

    if (kind === "relationship" || kind === "transaction") {
      const a = sampleAgent();
      const b = sampleAgent();
      if (a === b) continue;
      const key = a < b ? `${a}|${b}|${kind}` : `${b}|${a}|${kind}`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      const since = randomDate(rng);
      if (kind === "relationship") {
        const type = pick(rng, REL_TYPES);
        const family: RelationshipFamily = RELATIONSHIP_FAMILY[type];
        const label = pick(rng, REL_LABEL[type]);
        const directed = rng() < 0.35;
        const hasEnd = rng() < 0.2;
        edges.push({
          id: `r-${edges.length + 1}`,
          source: a,
          target: b,
          kind: "relationship",
          relationship_type: type,
          family,
          label,
          directed,
          start_date: since,
          end_date: hasEnd ? isoDate(Math.min(MAX_DATE, Date.parse(since) + rng() * 3 * 365 * 86400000)) : undefined,
          since,
          event_ids: [],
          description: `Registro sintético (${RELATIONSHIP_TYPE_LABEL[type].toLowerCase()}); não descreve fato real.`,
          ...base,
        });
      } else {
        const amount = Math.round(Math.pow(10, 4 + rng() * 4));
        edges.push({
          id: `t-${edges.length + 1}`,
          source: a,
          target: b,
          kind: "transaction",
          relationship_type: "transaction",
          family: "financial",
          label: `R$ ${amount.toLocaleString("pt-BR")} (exemplo)`,
          directed: true,
          start_date: since,
          since,
          event_ids: [],
          description: "Transação sintética; não descreve operação real.",
          ...base,
        });
      }
    } else if (kind === "participation") {
      const ev = pick(rng, events);
      const p = sampleAgent();
      const key = `${p}|${ev}|part`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      const since = eventDate.get(ev)!;
      edges.push({
        id: `part-${ev}-${p}`,
        source: p,
        target: ev,
        kind: "participation",
        relationship_type: "participation",
        family: "professional",
        label: "participa de",
        directed: true,
        since,
        event_ids: [ev],
        description: "Participação sintética; não descreve fato real.",
        ...base,
      });
    } else {
      const act = pick(rng, acts);
      const p = sampleAgent();
      const key = `${p}|${act}|actor`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      const since = eventDate.get(act)!;
      const affected = rng() < 0.3;
      edges.push({
        id: `${affected ? "affected" : "actor"}-${act}-${p}`,
        source: affected ? act : p,
        target: affected ? p : act,
        kind: "actor",
        relationship_type: "actor",
        family: "institutional",
        label: affected ? "afeta" : rng() < 0.3 ? "emite" : "atua em",
        directed: true,
        since,
        event_ids: [],
        description: "Atuação sintética; não descreve fato real.",
        ...base,
      });
    }
  }

  /* Métricas por nó (mesma lógica de scripts/lib/graph.ts). */
  const full = new Map<string, GraphNode>();
  for (const n of nodes) {
    full.set(n.id, {
      ...n,
      degree: 0,
      event_count: 0,
      official_source_count: 0,
      evidence_count: 0,
      x: 0,
      y: 0,
      size: 1,
    });
  }
  const minDate = (a?: string, b?: string) => (!a ? b : !b ? a : a < b ? a : b);
  for (const e of edges) {
    const officialCount = e.source_ids.filter((s) => s.startsWith("fonte-oficial")).length;
    for (const id of [e.source, e.target]) {
      const n = full.get(id)!;
      n.degree += 1;
      n.official_source_count += officialCount;
      n.evidence_count += e.evidence_ids.length;
      if (e.kind === "participation" || e.kind === "actor") {
        if (n.kind === "person" || n.kind === "organization") n.event_count += 1;
      }
      if (e.since) n.first_seen = minDate(n.first_seen, e.since);
    }
  }
  for (const n of full.values()) {
    const base = n.kind === "person" || n.kind === "organization" ? 4 : 2.5;
    n.size = Number((base + Math.log2(1 + n.degree) * 1.4).toFixed(2));
  }

  /* Layout: posições aleatórias + ForceAtlas2 (Barnes-Hut). */
  const g = new Graph({ multi: true, type: "mixed" });
  for (const n of full.values()) g.addNode(n.id, { size: n.size });
  for (const e of edges) {
    if (e.directed) g.addDirectedEdgeWithKey(e.id, e.source, e.target, { weight: 1 });
    else g.addUndirectedEdgeWithKey(e.id, e.source, e.target, { weight: 1 });
  }
  random.assign(g, { scale: 1000, rng });
  const settings = forceAtlas2.inferSettings(g);
  const t0 = Date.now();
  forceAtlas2.assign(g, {
    iterations: opts.iterations,
    settings: {
      ...settings,
      gravity: 1,
      scalingRatio: 8,
      barnesHutOptimize: g.order > 800,
      barnesHutTheta: 0.6,
    },
  });
  console.log(`  FA2 ${opts.iterations} it. em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  g.forEachNode((id, attrs) => {
    const n = full.get(id)!;
    n.x = Number(attrs.x.toFixed(2));
    n.y = Number(attrs.y.toFixed(2));
  });

  const dates = edges.map((e) => e.since).filter(Boolean) as string[];
  dates.sort();
  const officialSourceIds = new Set<string>();
  const sourceIds = new Set<string>();
  const evidenceIds = new Set<string>();
  for (const e of edges) {
    e.source_ids.forEach((s) => {
      sourceIds.add(s);
      if (s.startsWith("fonte-oficial")) officialSourceIds.add(s);
    });
    e.evidence_ids.forEach((s) => evidenceIds.add(s));
  }

  const stats: GraphStats = {
    people: people.length,
    organizations: orgs.length,
    events: events.length,
    public_acts: acts.length,
    transactions: edges.filter((e) => e.kind === "transaction").length,
    documents: 0,
    sources: sourceIds.size,
    official_sources: officialSourceIds.size,
    evidence: evidenceIds.size,
    relationships: edges.filter((e) => e.kind === "relationship").length,
    claims: 0,
    nodes: full.size,
    edges: edges.length,
    min_date: dates[0],
    max_date: dates[dates.length - 1],
  };

  return {
    version: 1,
    built_at: new Date().toISOString(),
    stats,
    nodes: [...full.values()],
    edges,
  };
}

/* ------------------------------------------------------------------ */
/* CLI                                                                  */
/* ------------------------------------------------------------------ */

const outDir = path.resolve(process.cwd(), "public/data");
fs.mkdirSync(outDir, { recursive: true });
const demoOnly = process.argv.includes("--demo-only");

console.log("Gerando graph-demo.json (120 nós / 400 arestas)…");
const demo = synth({ nodes: 120, edges: 400, seed: 7, iterations: 400 });
fs.writeFileSync(path.join(outDir, "graph-demo.json"), JSON.stringify(demo));
console.log(`  ${demo.stats.nodes} nós, ${demo.stats.edges} arestas`);

if (!demoOnly) {
  console.log("Gerando graph-stress.json (5.000 nós / 25.000 arestas)…");
  const stress = synth({ nodes: 5000, edges: 25000, seed: 42, iterations: 200 });
  fs.writeFileSync(path.join(outDir, "graph-stress.json"), JSON.stringify(stress));
  const bytes = fs.statSync(path.join(outDir, "graph-stress.json")).size;
  console.log(`  ${stress.stats.nodes} nós, ${stress.stats.edges} arestas, ${(bytes / 1e6).toFixed(1)} MB`);
}
