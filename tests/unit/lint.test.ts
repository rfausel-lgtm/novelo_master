import { describe, it, expect } from "vitest";
import { lintCorpus } from "../../scripts/lib/lint";
import { minimalCorpus } from "./fixtures";

const errors = (c: ReturnType<typeof minimalCorpus>) =>
  lintCorpus(c).filter((i) => i.level === "error").map((i) => `${i.file}: ${i.message}`);

describe("lint editorial", () => {
  it("corpus mínimo válido não tem erros", () => {
    expect(errors(minimalCorpus())).toEqual([]);
  });

  it("bloqueia referência a id inexistente", () => {
    const c = minimalCorpus();
    c.relationships[0].evidence_ids = ["ev-nao-existe"];
    expect(errors(c).some((e) => e.includes("inexistente"))).toBe(true);
  });

  it("bloqueia relação sem suporte que não seja inferência", () => {
    const c = minimalCorpus();
    const r = c.relationships[1];
    r.evidence_ids = [];
    r.source_ids = [];
    expect(errors(c).some((e) => e.includes("sem evidence_ids/source_ids"))).toBe(true);
  });

  it("aceita inferência quando há evidência I com inference_basis", () => {
    const c = minimalCorpus();
    c.evidence.push({
      id: "ev-i",
      kind: "evidence",
      classification: "I",
      proposition: "Intervalo de dez dias entre encontro e ato.",
      document_ids: [],
      source_ids: [],
      inference_basis: "O intervalo é fato; o nexo causal não se conclui.",
      review_status: "published",
      created_at: "2026-09-01",
      updated_at: "2026-09-01",
    });
    const r = c.relationships[1];
    r.evidence_class = "I";
    r.evidence_ids = ["ev-i"];
    r.source_ids = [];
    r.event_ids = ["evt-2025-11-18-teste"];
    expect(errors(c)).toEqual([]);
  });

  it("bloqueia inferência sem evidência I com raciocínio explícito", () => {
    const c = minimalCorpus();
    const r = c.relationships[1];
    r.evidence_class = "I";
    r.evidence_ids = [];
    r.source_ids = [];
    r.event_ids = ["evt-2025-11-18-teste"];
    expect(errors(c).some((e) => e.includes("classe I exige"))).toBe(true);
  });

  it("bloqueia ato público verified com classe A", () => {
    const c = minimalCorpus();
    c.public_acts.push({
      id: "ato-2026-01-01-teste",
      kind: "public_act",
      title: "Ato",
      act_type: "judicial",
      date: "2026-01-01",
      date_precision: "day",
      actor_ids: ["pessoa-b"],
      affected_ids: [],
      description: "d",
      evidence_class: "A",
      status: "verified",
      evidence_ids: ["ev-a"],
      source_ids: [],
      document_ids: [],
      tags: [],
      review_status: "published",
      created_at: "2026-09-01",
      updated_at: "2026-09-01",
    });
    expect(errors(c).some((e) => e.includes("public-acts") && e.includes("verified incompatível"))).toBe(true);
  });

  it("avisa sobre prefixo de id fora da convenção", () => {
    const c = minimalCorpus();
    c.events[0].id = "2025-11-18-sem-prefixo";
    const warnings = lintCorpus(c).filter((i) => i.level === "warning");
    expect(warnings.some((w) => w.message.includes("prefixo"))).toBe(true);
  });

  it("bloqueia status verified para alegação ou inferência", () => {
    const c = minimalCorpus();
    c.relationships[1].status = "verified";
    expect(errors(c).some((e) => e.includes("verified incompatível"))).toBe(true);
  });

  it("bloqueia classe D sem documento primário", () => {
    const c = minimalCorpus();
    c.evidence[0].document_ids = [];
    expect(errors(c).some((e) => e.includes("classe D exige"))).toBe(true);
  });

  it("bloqueia classe C com uma única fonte", () => {
    const c = minimalCorpus();
    c.evidence[1].classification = "C";
    expect(errors(c).some((e) => e.includes("classe C exige"))).toBe(true);
  });

  it("bloqueia alegação sem atribuição", () => {
    const c = minimalCorpus();
    delete c.evidence[1].attributed_to;
    expect(errors(c).some((e) => e.includes("classe A exige"))).toBe(true);
  });

  it("bloqueia evidence_class da relação acima da melhor evidência ligada", () => {
    const c = minimalCorpus();
    c.relationships[1].evidence_class = "D";
    c.relationships[1].status = "unverified";
    expect(errors(c).some((e) => e.includes("superior à melhor evidência"))).toBe(true);
  });

  it("avisa sobre termo imputativo sem qualificador", () => {
    const c = minimalCorpus();
    c.relationships[0].description = "Ele é corrupto.";
    const warnings = lintCorpus(c).filter((i) => i.level === "warning");
    expect(warnings.some((w) => w.message.includes("imputativo"))).toBe(true);
  });

  it("não avisa quando o termo vem qualificado como alegação", () => {
    const c = minimalCorpus();
    c.relationships[0].description = "Segundo a PF, haveria pagamento de propina.";
    const warnings = lintCorpus(c).filter((i) => i.level === "warning" && i.message.includes("imputativo"));
    expect(warnings).toEqual([]);
  });

  it("bloqueia sequência com causalidade comprovada sem nexo documental", () => {
    const c = minimalCorpus();
    c.sequences.push({
      id: "seq-teste",
      kind: "temporal_sequence",
      title: "Seq",
      step_ids: ["evt-2025-11-18-teste", "evt-2025-11-18-teste"],
      temporal_proximity: "high",
      documentary_link: "absent",
      causality_proven: true,
      description: "d",
      limits: "l",
      source_ids: [],
      evidence_ids: [],
      tags: [],
      review_status: "published",
      created_at: "2026-09-01",
      updated_at: "2026-09-01",
    });
    expect(errors(c).some((e) => e.includes("causality_proven"))).toBe(true);
  });
});
