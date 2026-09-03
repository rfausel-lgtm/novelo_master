import type { Corpus } from "../../src/lib/schema";
import { OFFICIAL_SOURCE_TYPES } from "../../src/lib/schema";
import type { LoadIssue } from "./load";

/**
 * Lint editorial/estrutural do corpus (regras da METHODOLOGY.md e EDITORIAL_POLICY.md).
 *
 * ERROS bloqueiam o build:
 *  - referência a id inexistente;
 *  - relação/evento/ato/transação sem evidence_ids E sem source_ids, salvo classe I;
 *  - classe I sem inference_basis na evidência (quando houver evidência) ou sem descrição do limite;
 *  - evidência D sem document_ids;
 *  - evidência A sem attributed_to;
 *  - evidência C com menos de duas fontes;
 *  - fonte sem url/retrieved_at (já garantido pelo schema) e foto sem licença (schema);
 *  - status verified com classe A ou I em relação (alegação/inferência não é fato verificado);
 *  - from_id == to_id.
 *
 * AVISOS:
 *  - vocabulário imputativo sem qualificador de alegação;
 *  - agente sem cited_position;
 *  - relação sem data;
 *  - fonte não verificada (sem bloco verification).
 */

const IMPUTATIVE_TERMS = [
  "criminoso",
  "corrupto",
  "bandido",
  "quadrilha",
  "fraudador",
  "ladrão",
  "propina",
  "lavou dinheiro",
  "comprou o ministro",
  "comprou a decisão",
  "mensalão",
  "esquema criminoso",
];

const QUALIFIERS = [
  "segundo",
  "conforme",
  "de acordo com",
  "alega",
  "alegou",
  "afirma",
  "afirmou",
  "aponta",
  "apontou",
  "sustenta",
  "sustentou",
  "acusa",
  "acusou",
  "denúncia",
  "suspeita",
  "investiga",
  "hipótese",
  "nega",
  "negou",
  "supost",
  "presum",
];

function idsOf(corpus: Corpus): Map<string, string> {
  const m = new Map<string, string>();
  const add = (arr: { id: string }[], kind: string) => arr.forEach((r) => m.set(r.id, kind));
  add(corpus.people, "person");
  add(corpus.organizations, "organization");
  add(corpus.events, "event");
  add(corpus.relationships, "relationship");
  add(corpus.claims, "claim");
  add(corpus.sources, "source");
  add(corpus.documents, "document");
  add(corpus.public_acts, "public_act");
  add(corpus.transactions, "transaction");
  add(corpus.evidence, "evidence");
  add(corpus.sequences, "temporal_sequence");
  return m;
}

export function lintCorpus(corpus: Corpus): LoadIssue[] {
  const issues: LoadIssue[] = [];
  const ids = idsOf(corpus);
  const sources = new Map(corpus.sources.map((s) => [s.id, s]));
  const evidence = new Map(corpus.evidence.map((e) => [e.id, e]));

  const err = (file: string, message: string) => issues.push({ level: "error", file, message });
  const warn = (file: string, message: string) => issues.push({ level: "warning", file, message });

  const checkRefs = (
    file: string,
    field: string,
    refs: string[] | undefined,
    allowedKinds?: string[],
  ) => {
    for (const ref of refs ?? []) {
      const kind = ids.get(ref);
      if (!kind) {
        err(file, `${field}: referência a id inexistente "${ref}"`);
      } else if (allowedKinds && !allowedKinds.includes(kind)) {
        err(file, `${field}: "${ref}" é ${kind}, esperado ${allowedKinds.join("|")}`);
      }
    }
  };

  const checkImputation = (file: string, field: string, text: string | undefined) => {
    if (!text) return;
    const lower = text.toLowerCase();
    for (const term of IMPUTATIVE_TERMS) {
      if (lower.includes(term) && !QUALIFIERS.some((q) => lower.includes(q))) {
        warn(file, `${field}: termo imputativo "${term}" sem qualificador de alegação/atribuição`);
      }
    }
  };

  const hasOfficial = (sourceIds: string[]) =>
    sourceIds.some((id) => {
      const s = sources.get(id);
      return s ? OFFICIAL_SOURCE_TYPES.has(s.source_type) : false;
    });

  const collectSourceIds = (evidenceIds: string[], sourceIds: string[]) => {
    const set = new Set(sourceIds);
    for (const eid of evidenceIds) {
      const ev = evidence.get(eid);
      ev?.source_ids.forEach((s) => set.add(s));
    }
    return [...set];
  };

  /* ---- fontes ---- */
  for (const s of corpus.sources) {
    const file = `sources/${s.id}.yaml`;
    if (!s.verification) warn(file, "fonte sem bloco verification (Source Verification Agent)");
    if (s.source_type === "social_media" || s.source_type === "blog") {
      warn(file, `fonte ${s.source_type}: usar apenas como pista, salvo publicação da própria pessoa`);
    }
  }

  /* ---- documentos ---- */
  for (const d of corpus.documents) {
    const file = `documents/${d.id}.yaml`;
    checkRefs(file, "source_ids", d.source_ids, ["source"]);
    checkRefs(file, "related_entity_ids", d.related_entity_ids, ["person", "organization"]);
    if (d.issuer_id) checkRefs(file, "issuer_id", [d.issuer_id], ["person", "organization"]);
    if (!d.url && !d.raw_path && d.source_ids.length === 0) {
      err(file, "documento sem url, raw_path ou source_ids: não rastreável");
    }
  }

  /* ---- evidências ---- */
  for (const e of corpus.evidence) {
    const file = `evidence/${e.id}.yaml`;
    checkRefs(file, "document_ids", e.document_ids, ["document"]);
    checkRefs(file, "source_ids", e.source_ids, ["source"]);
    if (e.attributed_to_id) checkRefs(file, "attributed_to_id", [e.attributed_to_id]);
    if (e.document_ids.length === 0 && e.source_ids.length === 0 && e.classification !== "I") {
      err(file, "evidência sem document_ids nem source_ids");
    }
    if (e.classification === "D" && e.document_ids.length === 0) {
      err(file, "classe D exige ao menos um document_ids (documento primário)");
    }
    if (e.classification === "C" && e.source_ids.length + e.document_ids.length < 2) {
      err(file, "classe C exige ao menos duas fontes/documentos independentes");
    }
    if (e.classification === "A" && !e.attributed_to && !e.attributed_to_id) {
      err(file, "classe A exige attributed_to (quem alegou)");
    }
    if (e.classification === "I" && !e.inference_basis) {
      err(file, "classe I exige inference_basis (raciocínio e limite explícitos)");
    }
    checkImputation(file, "proposition", e.proposition);
  }

  /* ---- pessoas e organizações ---- */
  for (const p of [...corpus.people, ...corpus.organizations]) {
    const file = `${p.kind === "person" ? "people" : "organizations"}/${p.id}.yaml`;
    checkRefs(file, "source_ids", p.source_ids, ["source"]);
    for (const cp of p.cited_position) checkRefs(file, "cited_position.source_ids", cp.source_ids, ["source"]);
    if (p.cited_position.length === 0) warn(file, "sem cited_position (contraditório): será exibido como 'não localizada'");
    checkImputation(file, "summary", p.summary);
    checkImputation(file, "why_in_novelo", p.why_in_novelo);
    if (p.kind === "person") {
      for (const pos of p.positions) {
        if (pos.organization_id) checkRefs(file, "positions.organization_id", [pos.organization_id], ["organization"]);
        checkRefs(file, "positions.source_ids", pos.source_ids, ["source"]);
      }
    }
  }

  /* ---- eventos ---- */
  for (const ev of corpus.events) {
    const file = `events/${ev.id}.yaml`;
    checkRefs(file, "participant_ids", ev.participant_ids, ["person", "organization"]);
    checkRefs(file, "evidence_ids", ev.evidence_ids, ["evidence"]);
    checkRefs(file, "source_ids", ev.source_ids, ["source"]);
    checkRefs(file, "document_ids", ev.document_ids, ["document"]);
    checkRefs(file, "public_act_ids", ev.public_act_ids, ["public_act"]);
    if (ev.evidence_ids.length === 0 && ev.source_ids.length === 0 && ev.evidence_class !== "I") {
      err(file, "evento sem evidence_ids nem source_ids (só permitido para classe I)");
    }
    if (ev.status === "verified" && (ev.evidence_class === "A" || ev.evidence_class === "I")) {
      err(file, `status verified incompatível com classe ${ev.evidence_class}`);
    }
    checkImputation(file, "description", ev.description);
  }

  /* ---- atos públicos ---- */
  for (const a of corpus.public_acts) {
    const file = `public-acts/${a.id}.yaml`;
    checkRefs(file, "actor_ids", a.actor_ids, ["person", "organization"]);
    checkRefs(file, "affected_ids", a.affected_ids, ["person", "organization"]);
    if (a.issuer_id) checkRefs(file, "issuer_id", [a.issuer_id], ["person", "organization"]);
    checkRefs(file, "evidence_ids", a.evidence_ids, ["evidence"]);
    checkRefs(file, "source_ids", a.source_ids, ["source"]);
    checkRefs(file, "document_ids", a.document_ids, ["document"]);
    if (a.evidence_ids.length === 0 && a.source_ids.length === 0 && a.document_ids.length === 0) {
      err(file, "ato público sem evidência, fonte ou documento");
    }
    checkImputation(file, "description", a.description);
  }

  /* ---- transações ---- */
  for (const t of corpus.transactions) {
    const file = `transactions/${t.id}.yaml`;
    checkRefs(file, "from_id", [t.from_id], ["person", "organization"]);
    checkRefs(file, "to_id", [t.to_id], ["person", "organization"]);
    checkRefs(file, "evidence_ids", t.evidence_ids, ["evidence"]);
    checkRefs(file, "source_ids", t.source_ids, ["source"]);
    checkRefs(file, "document_ids", t.document_ids, ["document"]);
    checkRefs(file, "event_ids", t.event_ids, ["event"]);
    if (t.evidence_ids.length === 0 && t.source_ids.length === 0 && t.evidence_class !== "I") {
      err(file, "transação sem evidence_ids nem source_ids");
    }
    if (t.status === "verified" && (t.evidence_class === "A" || t.evidence_class === "I")) {
      err(file, `status verified incompatível com classe ${t.evidence_class}`);
    }
    checkImputation(file, "description", t.description);
  }

  /* ---- relações ---- */
  for (const r of corpus.relationships) {
    const file = `relationships/${r.id}.yaml`;
    checkRefs(file, "from_id", [r.from_id], ["person", "organization"]);
    checkRefs(file, "to_id", [r.to_id], ["person", "organization"]);
    if (r.via_id) checkRefs(file, "via_id", [r.via_id], ["person", "organization"]);
    checkRefs(file, "event_ids", r.event_ids, ["event"]);
    checkRefs(file, "evidence_ids", r.evidence_ids, ["evidence"]);
    checkRefs(file, "source_ids", r.source_ids, ["source"]);
    checkRefs(file, "document_ids", r.document_ids, ["document"]);
    checkRefs(file, "transaction_ids", r.transaction_ids, ["transaction"]);
    for (const cp of r.cited_position) checkRefs(file, "cited_position.source_ids", cp.source_ids, ["source"]);

    if (r.from_id === r.to_id) err(file, "from_id igual a to_id");

    const hasSupport =
      r.evidence_ids.length > 0 || r.source_ids.length > 0 || r.document_ids.length > 0;
    if (!hasSupport && r.evidence_class !== "I") {
      err(file, "relação sem evidence_ids/source_ids/document_ids e não classificada como inferência (I)");
    }
    if (r.evidence_class === "I" && !hasSupport && r.event_ids.length === 0) {
      err(file, "inferência (I) precisa apontar ao menos para event_ids que a fundamentam");
    }
    if (r.status === "verified" && (r.evidence_class === "A" || r.evidence_class === "I")) {
      err(file, `status verified incompatível com classe ${r.evidence_class}`);
    }
    if (r.relationship_type === "investigative_allegation" && r.evidence_class === "D") {
      warn(file, "alegação investigativa classificada como D: confirme se o documento prova o fato ou apenas registra a alegação");
    }
    if (r.relationship_type === "intermediary" && !r.via_id) {
      warn(file, "relação de intermediação sem via_id");
    }
    if (!r.start_date && r.event_ids.length === 0) {
      warn(file, "relação sem start_date nem event_ids: não aparecerá na time machine com data própria");
    }
    // Classe de evidência coerente com as evidências ligadas.
    const linked = r.evidence_ids.map((id) => evidence.get(id)).filter(Boolean);
    if (linked.length > 0) {
      const rank = { D: 4, C: 3, A: 2, I: 1 } as const;
      const best = Math.max(...linked.map((e) => rank[e!.classification]));
      if (rank[r.evidence_class] > best) {
        err(file, `evidence_class ${r.evidence_class} superior à melhor evidência ligada`);
      }
    }
    const allSources = collectSourceIds(r.evidence_ids, r.source_ids);
    if (r.evidence_class === "D" && !hasOfficial(allSources) && r.document_ids.length === 0) {
      const docViaEvidence = linked.some((e) => e!.document_ids.length > 0);
      if (!docViaEvidence) err(file, "classe D sem documento primário ligado (direto ou via evidência)");
    }
    checkImputation(file, "description", r.description);
    checkImputation(file, "label", r.label);
  }

  /* ---- claims ---- */
  for (const c of corpus.claims) {
    const file = `claims/${c.id}.yaml`;
    checkRefs(file, "related_entity_ids", c.related_entity_ids, ["person", "organization"]);
    checkRefs(file, "event_ids", c.event_ids, ["event"]);
    checkRefs(file, "evidence_ids", c.evidence_ids, ["evidence"]);
    checkRefs(file, "source_ids", c.source_ids, ["source"]);
    if (c.claimant_id) checkRefs(file, "claimant_id", [c.claimant_id]);
    if (c.evidence_ids.length === 0 && c.source_ids.length === 0) {
      err(file, "claim sem evidência nem fonte");
    }
    if (c.status === "verified" && (c.classification === "A" || c.classification === "I")) {
      err(file, `status verified incompatível com classificação ${c.classification}`);
    }
    if (c.review_status === "published" && !c.adversarial_review) {
      warn(file, "claim publicado sem adversarial_review");
    }
    checkImputation(file, "statement", c.statement);
  }

  /* ---- sequências ---- */
  for (const s of corpus.sequences) {
    const file = `sequences/${s.id}.yaml`;
    checkRefs(file, "step_ids", s.step_ids, ["event", "public_act"]);
    checkRefs(file, "source_ids", s.source_ids, ["source"]);
    checkRefs(file, "evidence_ids", s.evidence_ids, ["evidence"]);
    if (s.causality_proven && s.documentary_link !== "present") {
      err(file, "causality_proven=true exige documentary_link=present");
    }
    checkImputation(file, "description", s.description);
  }

  return issues;
}
