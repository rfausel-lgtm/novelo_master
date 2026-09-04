import { describe, expect, it } from "vitest";
import { construirKml } from "../../scripts/lib/kml";
import type { Corpus } from "@/lib/schema";

const vazio = {
  people: [],
  organizations: [],
  events: [],
  public_acts: [],
  transactions: [],
  relationships: [],
  claims: [],
  documents: [],
  sources: [],
  evidence: [],
  sequences: [],
  revisions: [],
  built_at: "2026-09-04T00:00:00.000Z",
} as unknown as Corpus;

function corpusCom(evento: Record<string, unknown>): Corpus {
  return { ...vazio, events: [evento] } as unknown as Corpus;
}

const lugar = {
  name: "Terreno em Jequitibá (MG)",
  kind: "property",
  lat: -19.2273,
  lon: -44.0231,
  precision: "city",
  source_ids: [],
};

describe("construirKml", () => {
  it("não gera marcador para registro sem lugar", () => {
    const { texto, lugares } = construirKml(
      corpusCom({ id: "e1", title: "Sem lugar", review_status: "published" }),
    );
    expect(lugares).toBe(0);
    expect(texto).not.toContain("<Placemark>");
  });

  it("ignora registro não publicado, como o resto do site", () => {
    const { lugares } = construirKml(
      corpusCom({ id: "e1", title: "Rascunho", review_status: "draft", place: lugar }),
    );
    expect(lugares).toBe(0);
  });

  it("escreve longitude antes de latitude, como o KML exige", () => {
    const { texto, lugares } = construirKml(
      corpusCom({ id: "e1", title: "Venda do terreno", review_status: "published", place: lugar }),
    );
    expect(lugares).toBe(1);
    expect(texto).toContain("<coordinates>-44.0231,-19.2273,0</coordinates>");
  });

  it("aponta para o registro que sustenta o marcador", () => {
    const { texto } = construirKml(
      corpusCom({ id: "evt-x", title: "Venda", review_status: "published", place: lugar }),
    );
    expect(texto).toContain("/eventos/evt-x/");
  });

  it("escapa caracteres que quebrariam o XML", () => {
    const { texto } = construirKml(
      corpusCom({
        id: "e1",
        title: 'Fundo "São Domingos" & cia <teste>',
        review_status: "published",
        place: lugar,
      }),
    );
    expect(texto).toContain("&amp;");
    expect(texto).toContain("&quot;");
    expect(texto).not.toMatch(/<name>[^<]*<teste>/);
  });
});
