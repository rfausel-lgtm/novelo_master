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

/*
 * O caso que prendeu o saneamento no topo da home em 12/09/2026: dezenas de revisões com a mesma
 * `date`, e o desempate pelo texto do id pondo "saneamento" acima de todo "lote" e "auditoria"
 * abaixo de todos, qualquer que fosse a hora em que cada uma foi publicada.
 */
describe("ordem pelo instante de publicação", () => {
  const revP = (id: string, date: string, published_at?: string) => ({ id, date, published_at });
  const ordemP = (lista: { id: string; date: string; published_at?: string }[]) =>
    [...lista].sort(compararRevisoes).map((r) => r.id);

  it("na mesma data, o instante decide, não o texto do id", () => {
    expect(
      ordemP([
        revP("rev-2026-09-12-saneamento-cpfs", "2026-09-12", "2026-09-12T20:47:08-03:00"),
        revP("rev-2026-09-12-lote-256-a", "2026-09-12", "2026-09-12T21:24:43-03:00"),
        revP("rev-2026-09-12-auditoria-x", "2026-09-12", "2026-09-12T21:30:00-03:00"),
        revP("rev-2026-09-12-lote-255-b", "2026-09-12", "2026-09-12T21:18:04-03:00"),
      ]),
    ).toEqual([
      "rev-2026-09-12-auditoria-x",
      "rev-2026-09-12-lote-256-a",
      "rev-2026-09-12-lote-255-b",
      "rev-2026-09-12-saneamento-cpfs",
    ]);
  });

  it("compara instantes, não texto: 21:00 em -03:00 é depois de 23:30 UTC", () => {
    expect(
      ordemP([
        revP("rev-2026-09-12-lote-9-utc", "2026-09-12", "2026-09-12T23:30:00Z"),
        revP("rev-2026-09-12-lote-2-brt", "2026-09-12", "2026-09-12T21:00:00-03:00"),
      ]),
    ).toEqual(["rev-2026-09-12-lote-2-brt", "rev-2026-09-12-lote-9-utc"]);
  });

  it("revisão ainda sem horário conta como a mais recente do dia", () => {
    expect(
      ordemP([
        revP("rev-2026-09-12-lote-300-com-horario", "2026-09-12", "2026-09-12T23:59:00-03:00"),
        revP("rev-2026-09-12-lote-1-sem-horario", "2026-09-12"),
      ]),
    ).toEqual(["rev-2026-09-12-lote-1-sem-horario", "rev-2026-09-12-lote-300-com-horario"]);
  });

  it("a data editorial continua valendo antes do horário", () => {
    expect(
      ordemP([
        revP("rev-2026-09-12-lote-2-a", "2026-09-12", "2026-09-13T09:00:00-03:00"),
        revP("rev-2026-09-13-lote-1-b", "2026-09-13", "2026-09-12T09:00:00-03:00"),
      ]),
    ).toEqual(["rev-2026-09-13-lote-1-b", "rev-2026-09-12-lote-2-a"]);
  });
});
