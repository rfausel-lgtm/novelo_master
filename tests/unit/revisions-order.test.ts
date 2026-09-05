import { describe, expect, it } from "vitest";

/**
 * A ordem das revisões é o que a home e /atualizacoes mostram como "mais recente". Todas as revisões
 * do corpus hoje têm a mesma `date`, então o desempate por id em ordem natural é o que carrega a
 * sequência — e `lote-70` tem de vir antes de `lote-7`, que a comparação de texto inverteria.
 */
const NATURAL = new Intl.Collator("pt-BR", { numeric: true });
const ordenar = (revs: { id: string; date: string }[]) =>
  [...revs].sort((a, b) => b.date.localeCompare(a.date) || NATURAL.compare(b.id, a.id));

describe("ordem das revisões", () => {
  it("data mais recente primeiro", () => {
    const r = ordenar([
      { id: "rev-2026-09-01-lote-1", date: "2026-09-01" },
      { id: "rev-2026-09-04-lote-2", date: "2026-09-04" },
    ]);
    expect(r.map((x) => x.id)).toEqual(["rev-2026-09-04-lote-2", "rev-2026-09-01-lote-1"]);
  });

  it("empate na data cai no número do lote, não na ordem alfabética", () => {
    const mesmaData = ["lote-7", "lote-10", "lote-70", "lote-9"].map((l) => ({
      id: `rev-2026-09-03-${l}`,
      date: "2026-09-03",
    }));
    expect(ordenar(mesmaData).map((x) => x.id.replace("rev-2026-09-03-", ""))).toEqual([
      "lote-70",
      "lote-10",
      "lote-9",
      "lote-7",
    ]);
  });
});
