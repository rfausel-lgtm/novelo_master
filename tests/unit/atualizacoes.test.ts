import { describe, expect, it } from "vitest";
import { hrefDaPagina, loteDo, rotuloDoIntervalo } from "@/lib/atualizacoes";

const id = (lote: string) => `rev-2026-09-11-lote-${lote}-um-slug-qualquer`;

describe("paginação de /atualizacoes", () => {
  it("a página 1 é /atualizacoes, não /pagina/1", () => {
    expect(hrefDaPagina(1)).toBe("/atualizacoes");
    expect(hrefDaPagina(2)).toBe("/atualizacoes/pagina/2");
  });

  it("lê o número do lote a partir do id", () => {
    expect(loteDo(id("195"))).toBe("195");
    expect(loteDo(id("75b"))).toBe("75b");
  });

  /* Existem revisões sem lote no acervo — a primeira delas é `rev-2026-09-03-seed-inicial`. */
  it("devolve nulo quando o id não traz lote", () => {
    expect(loteDo("rev-2026-09-03-seed-inicial")).toBeNull();
  });

  it("o rótulo nomeia o intervalo de lotes e a posição no total", () => {
    expect(rotuloDoIntervalo([id("195"), id("186")], 0, 204)).toBe(
      "lote 195 até lote 186 · 1–2 de 204",
    );
  });

  /*
   * Sem lote nas pontas o rótulo não pode mentir um intervalo: cai para a posição, que sempre existe.
   */
  it("cai para a posição quando a ponta não tem lote", () => {
    expect(rotuloDoIntervalo(["rev-2026-09-03-seed-inicial", id("2")], 200, 204)).toBe(
      "201–202 de 204 atualizações",
    );
  });

  it("não anuncia intervalo quando as duas pontas são o mesmo lote", () => {
    expect(rotuloDoIntervalo([id("83")], 10, 204)).toBe("11–11 de 204 atualizações");
  });
});
