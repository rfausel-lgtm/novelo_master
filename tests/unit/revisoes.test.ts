import { describe, expect, it } from "vitest";
import { compararRevisoes } from "@/lib/data";

const rev = (id: string, date: string) => ({ id, date });
const ordem = (lista: { id: string; date: string }[]) =>
  [...lista].sort(compararRevisoes).map((r) => r.id);

describe("ordem das atualizações", () => {
  it("data mais recente primeiro", () => {
    expect(
      ordem([
        rev("rev-2026-09-03-lote-1-a", "2026-09-03"),
        rev("rev-2026-09-06-lote-2-b", "2026-09-06"),
      ]),
    ).toEqual(["rev-2026-09-06-lote-2-b", "rev-2026-09-03-lote-1-a"]);
  });

  it("na mesma data, o lote maior vem primeiro", () => {
    expect(
      ordem([
        rev("rev-2026-09-06-lote-108-a", "2026-09-06"),
        rev("rev-2026-09-06-lote-109-b", "2026-09-06"),
        rev("rev-2026-09-06-lote-104-c", "2026-09-06"),
      ]),
    ).toEqual([
      "rev-2026-09-06-lote-109-b",
      "rev-2026-09-06-lote-108-a",
      "rev-2026-09-06-lote-104-c",
    ]);
  });

  /*
   * O caso que quebrou o site: o id do lote 105 trazia 2026-09-08 enquanto os irmãos traziam
   * 2026-09-06, todos com o mesmo `date`. Comparar o id inteiro punha o 105 acima do 109.
   */
  it("ignora o prefixo de data do id, que diverge de `date` em boa parte do corpus", () => {
    expect(
      ordem([
        rev("rev-2026-09-08-lote-105-integra", "2026-09-06"),
        rev("rev-2026-09-06-lote-109-augusto", "2026-09-06"),
        rev("rev-2026-09-06-lote-108-pet", "2026-09-06"),
      ]),
    ).toEqual([
      "rev-2026-09-06-lote-109-augusto",
      "rev-2026-09-06-lote-108-pet",
      "rev-2026-09-08-lote-105-integra",
    ]);
  });

  it("ordena por número, não por texto: lote 70 acima de lote 7", () => {
    expect(
      ordem([
        rev("rev-2026-09-04-lote-7-a", "2026-09-03"),
        rev("rev-2026-09-04-lote-70-b", "2026-09-03"),
      ]),
    ).toEqual(["rev-2026-09-04-lote-70-b", "rev-2026-09-04-lote-7-a"]);
  });

  it("id sem número de lote não quebra a ordenação", () => {
    expect(
      ordem([
        rev("rev-2026-09-03-seed-inicial", "2026-09-03"),
        rev("rev-2026-09-06-lote-109-b", "2026-09-06"),
      ]),
    ).toEqual(["rev-2026-09-06-lote-109-b", "rev-2026-09-03-seed-inicial"]);
  });
});
