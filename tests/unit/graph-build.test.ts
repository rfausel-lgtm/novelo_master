import { describe, it, expect } from "vitest";
import { buildGraph } from "../../scripts/lib/graph";
import { minimalCorpus } from "./fixtures";

describe("buildGraph", () => {
  const payload = buildGraph(minimalCorpus(), { layout: false });

  it("cria nós para pessoas, organizações e eventos", () => {
    const ids = payload.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(["evt-2025-11-18-teste", "org-x", "pessoa-a", "pessoa-b"]);
  });

  it("cria arestas de relação e de participação", () => {
    const kinds = payload.edges.map((e) => e.kind);
    expect(kinds.filter((k) => k === "relationship")).toHaveLength(2);
    expect(kinds.filter((k) => k === "participation")).toHaveLength(2);
  });

  it("marca official e documented corretamente", () => {
    const d = payload.edges.find((e) => e.id === "rel-pessoa-a-org-x-corporate")!;
    const a = payload.edges.find((e) => e.id === "rel-pessoa-a-pessoa-b-allegation")!;
    expect(d.official).toBe(true);
    expect(d.documented).toBe(true);
    expect(a.official).toBe(false);
    expect(a.documented).toBe(false);
  });

  it("expande fontes via evidências", () => {
    const d = payload.edges.find((e) => e.id === "rel-pessoa-a-org-x-corporate")!;
    expect(d.source_ids).toContain("src-oficial");
  });

  it("deriva since da data do evento quando não há start_date", () => {
    const d = payload.edges.find((e) => e.id === "rel-pessoa-a-org-x-corporate")!;
    expect(d.since).toBe("2025-11-18");
    const a = payload.edges.find((e) => e.id === "rel-pessoa-a-pessoa-b-allegation")!;
    expect(a.since).toBe("2026-05-07");
  });

  it("calcula grau, eventos e fontes oficiais por nó", () => {
    const a = payload.nodes.find((n) => n.id === "pessoa-a")!;
    expect(a.degree).toBe(3);
    expect(a.event_count).toBe(1);
    expect(a.official_source_count).toBeGreaterThan(0);
    expect(a.first_seen).toBe("2025-11-18");
  });

  it("gera estatísticas e datas mínima/máxima", () => {
    expect(payload.stats.people).toBe(2);
    expect(payload.stats.official_sources).toBe(1);
    expect(payload.stats.min_date).toBe("2025-11-18");
    expect(payload.stats.max_date).toBe("2026-05-07");
  });

  it("aplica layout determinístico quando solicitado", () => {
    const p1 = buildGraph(minimalCorpus(), { layout: true, iterations: 50 });
    const p2 = buildGraph(minimalCorpus(), { layout: true, iterations: 50 });
    expect(p1.nodes.map((n) => [n.x, n.y])).toEqual(p2.nodes.map((n) => [n.x, n.y]));
    expect(p1.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
  });
});
