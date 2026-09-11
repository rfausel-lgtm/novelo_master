import { describe, expect, it } from "vitest";
import { hrefDaPagina, janelaDePaginas, loteDo, rotuloDoIntervalo } from "@/lib/atualizacoes";

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

describe("janela de páginas na barra", () => {
  it("com poucas páginas mostra todas, sem reticências", () => {
    expect(janelaDePaginas(1, 3)).toEqual([1, 2, 3]);
  });

  it("na primeira de 21: primeira, vizinha, reticências e última", () => {
    expect(janelaDePaginas(1, 21)).toEqual([1, 2, null, 21]);
  });

  it("no meio, reticências dos dois lados", () => {
    expect(janelaDePaginas(11, 21)).toEqual([1, null, 10, 11, 12, null, 21]);
  });

  it("na última, o caminho de volta ao começo continua a um clique", () => {
    expect(janelaDePaginas(21, 21)).toEqual([1, null, 20, 21]);
  });

  /* Pular exatamente uma página mostra o número: reticências escondendo um só item é ruído. */
  it("não põe reticências para esconder uma única página", () => {
    expect(janelaDePaginas(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("uma página só não vira barra", () => {
    expect(janelaDePaginas(1, 1)).toEqual([1]);
  });
});
