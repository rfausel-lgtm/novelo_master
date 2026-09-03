import { describe, expect, it } from "vitest";
import { applyFilters, defaultFilterState, isFilterActive } from "./filters";
import { FIXTURE } from "./fixture.test-data";
import { buildIndex } from "./indexes";

const index = buildIndex(FIXTURE);

describe("applyFilters", () => {
  it("padrão: tudo visível, incluindo nó isolado", () => {
    const v = applyFilters(index, defaultFilterState());
    expect(v.nodes.size).toBe(8);
    expect(v.edges.size).toBe(7);
    expect(isFilterActive(defaultFilterState())).toBe(false);
  });

  it("somente fontes oficiais esconde arestas não oficiais e nós sem aresta visível", () => {
    const f = { ...defaultFilterState(), officialOnly: true };
    const v = applyFilters(index, f);
    expect([...v.edges].sort()).toEqual(["p1", "p2", "r1", "r4"]);
    expect(v.nodes.has("c")).toBe(false); // r2 (C, não oficial), r3 (A), x1 (I)
    expect(v.nodes.has("ato1")).toBe(false);
    expect(v.nodes.has("d")).toBe(true); // isolado por natureza continua
    expect(isFilterActive(f)).toBe(true);
  });

  it("somente fatos documentados mantém D e C", () => {
    const v = applyFilters(index, { ...defaultFilterState(), documentedOnly: true });
    expect(v.edges.has("r2")).toBe(true);
    expect(v.edges.has("r3")).toBe(false);
    expect(v.edges.has("x1")).toBe(false);
  });

  it("classes de evidência e tipos de relação", () => {
    const f = defaultFilterState();
    f.evidenceClasses = new Set(["A"]);
    let v = applyFilters(index, f);
    expect([...v.edges]).toEqual(["r3"]);
    expect([...v.nodes].sort()).toEqual(["a", "c", "d"]);

    const g = defaultFilterState();
    g.relationshipTypes = new Set(["participation"]);
    v = applyFilters(index, g);
    expect([...v.edges].sort()).toEqual(["p1", "p2"]);
  });

  it("categorias de nó cortam arestas incidentes", () => {
    const f = defaultFilterState();
    f.nodeCategories.delete("event");
    const v = applyFilters(index, f);
    expect(v.nodes.has("ev1")).toBe(false);
    expect(v.edges.has("p1")).toBe(false);
    expect(v.edges.has("r1")).toBe(true);
  });

  it("time machine: dateUntil corta arestas futuras e nós ainda não vistos", () => {
    const v = applyFilters(index, { ...defaultFilterState(), dateUntil: "2020-12-31" });
    expect([...v.edges].sort()).toEqual(["p1", "p2", "r1"]);
    expect(v.nodes.has("c")).toBe(false);
    expect(v.nodes.has("e")).toBe(false);
    expect(v.nodes.has("d")).toBe(true); // isolado com first_seen 2018-02-01
    const v2 = applyFilters(index, { ...defaultFilterState(), dateUntil: "2018-01-01" });
    expect(v2.nodes.size).toBe(0);
  });

  it("time machine oculta e contabiliza relações sem data", () => {
    const undatedEdge = { ...FIXTURE.edges[0], id: "sem-data", since: undefined };
    const datedIndex = buildIndex({ ...FIXTURE, edges: [...FIXTURE.edges, undatedEdge] });
    const v = applyFilters(datedIndex, { ...defaultFilterState(), dateUntil: "2020-12-31" });
    expect(v.edges.has("sem-data")).toBe(false);
    expect(v.undatedEdgesExcluded).toBe(1);
  });

  it("não conta como oculta a relação de uma categoria desligada", () => {
    const hiddenEdge = { ...FIXTURE.edges[0], id: "camada-desligada", since: undefined };
    const idx = buildIndex({ ...FIXTURE, edges: [...FIXTURE.edges, hiddenEdge] });
    const nodeCategories = new Set(defaultFilterState().nodeCategories);
    nodeCategories.delete("person");
    const v = applyFilters(idx, { ...defaultFilterState(), nodeCategories, dateUntil: "2020-12-31" });
    expect(v.edges.has("camada-desligada")).toBe(false);
    expect(v.undatedEdgesExcluded).toBe(0);
  });

  it("busca não oculta nós", () => {
    const v = applyFilters(index, { ...defaultFilterState(), search: "zzz" });
    expect(v.nodes.size).toBe(8);
  });
});
