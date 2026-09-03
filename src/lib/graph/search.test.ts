import { describe, expect, it } from "vitest";
import { FIXTURE } from "./fixture.test-data";
import { buildIndex } from "./indexes";
import { fuzzyScore, normalize, searchNodes } from "./search";
import { addDays, addMonths, daysBetween, formatDatePT, toFullDate } from "./dates";

const index = buildIndex(FIXTURE);

describe("search", () => {
  it("normaliza acentos e caixa", () => {
    expect(normalize("Fábio Ção")).toBe("fabio cao");
  });
  it("pontua prefixo > substring > subsequência", () => {
    expect(fuzzyScore("bru", "Bruno Exemplo")).toBe(100);
    expect(fuzzyScore("xemp", "Bruno Exemplo")).toBeLessThan(100);
    expect(fuzzyScore("xemp", "Bruno Exemplo")).toBeGreaterThan(fuzzyScore("bxp", "Bruno Exemplo"));
    expect(fuzzyScore("qqq", "Bruno Exemplo")).toBe(0);
  });
  it("busca por rótulo ignorando acento e ordena por grau em empate", () => {
    const hits = searchNodes(index, "fabio");
    expect(hits[0].node.id).toBe("f");
    const all = searchNodes(index, "exemplo");
    expect(all[0].node.degree).toBeGreaterThanOrEqual(all[all.length - 1].node.degree);
    expect(searchNodes(index, "")).toEqual([]);
  });
  it("restringe ao conjunto visível quando informado", () => {
    const hits = searchNodes(index, "exemplo", 10, new Set(["e"]));
    expect(hits.map((h) => h.node.id)).toEqual(["e"]);
  });
});

describe("dates", () => {
  it("completa datas parciais e soma dias/meses", () => {
    expect(toFullDate("2024")).toBe("2024-01-01");
    expect(toFullDate("2024-03")).toBe("2024-03-01");
    expect(addDays("2024-02-28", 2)).toBe("2024-03-01");
    expect(addMonths("2024-01-31", 1)).toBe("2024-03-02");
    expect(daysBetween("2024-01-01", "2024-01-31")).toBe(30);
    expect(formatDatePT("2024-03-05")).toBe("5 mar 2024");
    expect(formatDatePT("2024-03")).toBe("mar 2024");
    expect(formatDatePT(undefined)).toBe("sem data");
  });
});
