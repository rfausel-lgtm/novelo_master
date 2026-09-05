import { describe, expect, it } from "vitest";
import { construirDossies } from "../../scripts/lib/acervo";
import { minimalCorpus } from "./fixtures";

describe("dossiê em texto por entidade", () => {
  const dossies = construirDossies(minimalCorpus());

  it("gera um arquivo por pessoa e organização publicada", () => {
    expect([...dossies.keys()].sort()).toEqual(["org-x", "pessoa-a", "pessoa-b"]);
  });

  it("traz as mesmas regras de leitura do acervo e o registro com posição do citado", () => {
    const texto = dossies.get("pessoa-a")!;
    expect(texto).toContain("## Como responder a partir deste arquivo");
    expect(texto).toContain("Nunca afirme crime");
    expect(texto).toContain("PESSOA|pessoa-a|Pessoa A|Controlador|");
    expect(texto).toContain("POSIÇÃO|pessoa-a|not_located|");
    expect(texto).toContain("/pessoas/pessoa-a/");
  });

  it("segue as mesmas regras de vínculo das páginas: relação, evento via relação, alegação", () => {
    const a = dossies.get("pessoa-a")!;
    expect(a).toContain("RELAÇÃO|rel-pessoa-a-org-x-corporate|D|Pessoa A -- Org X|");
    expect(a).toContain("RELAÇÃO|rel-pessoa-a-pessoa-b-allegation|A|");
    expect(a).toContain("EVENTO|evt-2025-11-18-teste|2025-11-18|D|Evento de teste|");
    /* A organização participa do evento diretamente; a pessoa B só aparece na alegação. */
    expect(dossies.get("org-x")!).toContain("EVENTO|evt-2025-11-18-teste|");
    expect(dossies.get("pessoa-b")!).not.toContain("EVENTO|evt-2025-11-18-teste|");
    expect(dossies.get("pessoa-b")!).toContain("segundo a PF");
  });

  it("não trunca: nenhuma reticência de corte", () => {
    for (const texto of dossies.values()) expect(texto).not.toContain("…");
  });
});
