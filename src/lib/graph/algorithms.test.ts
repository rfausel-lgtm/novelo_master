import { describe, expect, it } from "vitest";
import {
  commonNeighbors,
  edgesBetween,
  inducedSubgraph,
  intermediaries,
  kPaths,
  neighborhood,
  sharedEvents,
  shortestPath,
} from "./algorithms";
import { FIXTURE } from "./fixture.test-data";
import { buildIndex } from "./indexes";

const index = buildIndex(FIXTURE);

describe("buildIndex", () => {
  it("indexa nós, arestas e adjacência não direcionada", () => {
    expect(index.nodeById.size).toBe(8);
    expect(index.edgeById.size).toBe(7);
    expect(index.adjacency.get("a")!.map((x) => x.other).sort()).toEqual(["b", "c", "ev1"]);
    expect(index.adjacency.get("ev1")!.length).toBe(2);
  });
  it("calcula first_seen por fallback (mín. since das arestas, senão date)", () => {
    expect(index.nodeById.get("a")!.first_seen).toBe("2019-05-05");
    expect(index.nodeById.get("c")!.first_seen).toBe("2021-03-01");
    expect(index.nodeById.get("d")!.first_seen).toBe("2018-02-01");
    // não muta o payload original
    expect(FIXTURE.nodes.find((n) => n.id === "a")!.first_seen).toBeUndefined();
  });
});

describe("shortestPath", () => {
  it("encontra o caminho direto", () => {
    expect(shortestPath(index, "a", "c")).toEqual({ nodes: ["a", "c"], edges: ["r3"] });
  });
  it("atravessa eventos ignorando direção", () => {
    const p = shortestPath(index, "ev1", "ato1");
    expect(p?.nodes).toEqual(["ev1", "a", "c", "ato1"]);
  });
  it("respeita filtros de visibilidade", () => {
    const vis = { edges: new Set(["r1", "r2", "p1", "p2", "x1", "r4"]) }; // sem r3 (alegação)
    expect(shortestPath(index, "a", "c", vis)).toEqual({ nodes: ["a", "b", "c"], edges: ["r1", "r2"] });
  });
  it("retorna null para componentes desconexos ou nós inexistentes", () => {
    expect(shortestPath(index, "a", "e")).toBeNull();
    expect(shortestPath(index, "a", "zzz")).toBeNull();
    expect(shortestPath(index, "a", "a")).toEqual({ nodes: ["a"], edges: [] });
  });
});

describe("kPaths", () => {
  it("retorna o mais curto primeiro e alternativas simples distintas", () => {
    const paths = kPaths(index, "a", "c", undefined, { k: 3 });
    expect(paths[0]).toEqual({ nodes: ["a", "c"], edges: ["r3"] });
    const keys = paths.map((p) => p.nodes.join(">"));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("a>b>c");
    for (const p of paths) expect(p.edges.length).toBeLessThanOrEqual(3);
  });
  it("respeita maxLen", () => {
    const paths = kPaths(index, "a", "c", undefined, { k: 5, maxLen: 1 });
    expect(paths).toHaveLength(1);
  });
});

describe("neighborhood", () => {
  it("profundidade 1 e 2", () => {
    const n1 = neighborhood(index, "a", 1);
    expect([...n1.nodes].sort()).toEqual(["a", "b", "c", "ev1"]);
    expect([...n1.edges].sort()).toEqual(["p1", "p2", "r1", "r2", "r3"]); // inclui arestas entre vizinhos
    const n2 = neighborhood(index, "a", 2);
    expect(n2.nodes.has("ato1")).toBe(true);
    expect(n2.nodes.has("e")).toBe(false);
  });
});

describe("seleção múltipla", () => {
  it("commonNeighbors, sharedEvents e intermediaries", () => {
    expect(commonNeighbors(index, ["a", "b"]).sort()).toEqual(["c", "ev1"]);
    expect(sharedEvents(index, ["a", "b"])).toEqual(["ev1"]);
    expect(intermediaries(index, ["a", "c"])).toEqual(["b"]);
    expect(intermediaries(index, ["a", "b", "e"])).toEqual(expect.arrayContaining(["c", "ev1"]));
    expect(commonNeighbors(index, ["a", "b", "e"])).toEqual([]);
  });
  it("inducedSubgraph com e sem vizinhos", () => {
    const s = inducedSubgraph(index, ["a", "b"]);
    expect([...s.nodes]).toEqual(["a", "b"]);
    expect([...s.edges]).toEqual(["r1"]);
    const s2 = inducedSubgraph(index, ["a"], true);
    expect(s2.nodes.has("ev1")).toBe(true);
    expect(s2.edges.has("r2")).toBe(true);
  });
  it("edgesBetween", () => {
    expect(edgesBetween(index, "a", "b")).toEqual(["r1"]);
    expect(edgesBetween(index, "a", "e")).toEqual([]);
  });
});
