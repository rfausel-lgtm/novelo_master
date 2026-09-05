import { describe, expect, it } from "vitest";
import { listaDaUrl, listaParaUrl } from "@/lib/url-state";

const TODOS = ["D", "C", "A", "I"] as const;

describe("lista de valores na URL", () => {
  it("ausente significa todos e '-' significa nenhum", () => {
    expect([...listaDaUrl(null, TODOS)]).toEqual([...TODOS]);
    expect(listaDaUrl("-", TODOS).size).toBe(0);
  });

  it("descarta valor desconhecido e grava na ordem canônica", () => {
    expect([...listaDaUrl("I,X,D", TODOS)]).toEqual(["I", "D"]);
    expect(listaParaUrl(new Set(["I", "D"]), TODOS)).toBe("D,I");
  });

  it("todos vira ausente e nenhum vira '-', para o link não mentir", () => {
    expect(listaParaUrl(new Set(TODOS), TODOS)).toBeNull();
    expect(listaParaUrl(new Set<(typeof TODOS)[number]>(), TODOS)).toBe("-");
  });

  it("faz ida e volta sem perda", () => {
    type Classe = (typeof TODOS)[number];
    const casos: Classe[][] = [["D"], ["C", "A"], [], [...TODOS]];
    for (const escolha of casos) {
      const set = new Set<Classe>(escolha);
      expect(listaDaUrl(listaParaUrl(set, TODOS), TODOS)).toEqual(set);
    }
  });
});
