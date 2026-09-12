import { describe, expect, it } from "vitest";
import {
  corpoDoTitulo,
  dataExtensa,
  desenhoDe,
  geradorDe,
  htmlDoCard,
  loteDe,
  mancheteDoResumo,
  repartirTitulo,
} from "../../scripts/lib/card";

describe("gerador determinístico", () => {
  it("dá a mesma sequência para a mesma semente", () => {
    const a = geradorDe("rev-2026-09-11-lote-216-x");
    const b = geradorDe("rev-2026-09-11-lote-216-x");
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("dá sequências diferentes para sementes diferentes", () => {
    const a = geradorDe("rev-2026-09-11-lote-216-x");
    const b = geradorDe("rev-2026-09-11-lote-217-x");
    expect(a()).not.toEqual(b());
  });

  it("fica dentro de [0, 1)", () => {
    const r = geradorDe("qualquer");
    for (let i = 0; i < 500; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("desenho do novelo", () => {
  it("é função do id: mesmo id, mesma geometria", () => {
    expect(desenhoDe("rev-a-lote-1-x")).toEqual(desenhoDe("rev-a-lote-1-x"));
  });

  it("muda com o id", () => {
    expect(desenhoDe("rev-a-lote-1-x")).not.toEqual(desenhoDe("rev-a-lote-2-x"));
  });

  /*
   * O emaranhado sangra de propósito pela direita — fio cortado pela borda lê como novelo, fio que
   * para antes dela lê como diagrama. O que ele não pode é invadir a coluna do texto: a manchete
   * ocupa de 80 a 870 px, e o véu só escurece o que passa dali para a esquerda. Por isso a asserção
   * é sobre a margem esquerda e sobre o centro de massa, não sobre caber no quadro.
   */
  it("fica à direita e nunca encosta na margem do texto", () => {
    for (const id of ["rev-a-lote-1-x", "rev-b-lote-99-y", "rev-c-lote-227-z"]) {
      const nos = desenhoDe(id).nos;
      for (const no of nos) expect(no.x).toBeGreaterThan(500);
      const centro = nos.reduce((s, n) => s + n.x, 0) / nos.length;
      expect(centro).toBeGreaterThan(800);
    }
  });
});

describe("repartirTitulo", () => {
  it("tira o prefixo de lote com travessão e o promove à sobrelinha", () => {
    expect(
      repartirTitulo(
        "Lote 216 — não foi habeas corpus: como a CPI blindou Campos Neto",
        "rev-2026-09-11-lote-216-nao-foi-habeas-corpus",
        "2026-09-11",
      ),
    ).toEqual({
      eyebrow: "LOTE 216 · 11 SET 2026",
      manchete: "não foi habeas corpus: como a CPI blindou Campos Neto",
    });
  });

  it("aceita dois-pontos e hífen, que o acervo também usa", () => {
    expect(
      repartirTitulo("Lote 10: o controle externo", "rev-x-lote-10-y", "2026-09-03").manchete,
    ).toBe("o controle externo");
    expect(repartirTitulo("Lote 75b - os autos", "rev-x-lote-75b-y", "2026-09-05").eyebrow).toBe(
      "LOTE 75B · 05 SET 2026",
    );
  });

  it("título sem prefixo vai inteiro para a manchete, e o lote sai do id", () => {
    expect(
      repartirTitulo(
        "Saneamento: as órfãs com lastro documental voltam ao grafo",
        "rev-2026-09-11-lote-220-saneamento",
        "2026-09-11",
      ),
    ).toEqual({
      eyebrow: "LOTE 220 · 11 SET 2026",
      manchete: "Saneamento: as órfãs com lastro documental voltam ao grafo",
    });
  });

  it("id sem lote não inventa número", () => {
    expect(
      repartirTitulo("Uma revisão avulsa", "rev-2026-09-11-avulsa", "2026-09-11").eyebrow,
    ).toBe("11 SET 2026");
  });
});

describe("mancheteDoResumo", () => {
  it("corta na primeira frase de verdade", () => {
    expect(
      mancheteDoResumo("Lote 10: o controle externo e a crise. Entra a inspeção do TCU."),
    ).toBe("Lote 10: o controle externo e a crise");
  });

  it("não corta em ponto de número de processo nem de data abreviada", () => {
    expect(mancheteDoResumo("O IPL 2025.0087917 de 11.02.2026 trouxe o termo")).toBe(
      "O IPL 2025.0087917 de 11.02.2026 trouxe o termo",
    );
  });

  it("trunca resumo longo sem frase, com reticências", () => {
    const longo = "a".repeat(400);
    const saida = mancheteDoResumo(longo);
    expect(saida.length).toBeLessThanOrEqual(150);
    expect(saida.endsWith("…")).toBe(true);
  });
});

describe("dataExtensa", () => {
  it("formata data completa, parcial e só ano", () => {
    expect(dataExtensa("2026-09-11")).toBe("11 SET 2026");
    expect(dataExtensa("2026-09")).toBe("SET 2026");
    expect(dataExtensa("2026")).toBe("2026");
  });
});

describe("loteDe", () => {
  it("preserva o sufixo de letra, que identifica outra revisão", () => {
    expect(loteDe("rev-x-lote-75b-y")).toBe("75b");
    expect(loteDe("rev-x-lote-75-y")).toBe("75");
    expect(loteDe("rev-x-sem-lote")).toBeNull();
  });
});

describe("corpoDoTitulo", () => {
  it("encolhe conforme a manchete cresce", () => {
    const curto = corpoDoTitulo("a".repeat(30));
    const medio = corpoDoTitulo("a".repeat(80));
    const longo = corpoDoTitulo("a".repeat(200));
    expect(curto).toBeGreaterThan(medio);
    expect(medio).toBeGreaterThan(longo);
  });
});

describe("htmlDoCard", () => {
  it("escapa o título: aspas e sinais do acervo não podem virar marcação", () => {
    const html = htmlDoCard({
      eyebrow: "LOTE 1 · 01 JAN 2026",
      manchete: 'o "desvio" & <script>alert(1)</script>',
      desenho: desenhoDe("rev-x-lote-1-y"),
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;desvio&quot;");
    expect(html).toContain("&amp;");
  });

  it("é byte a byte igual para a mesma entrada", () => {
    const entrada = {
      eyebrow: "LOTE 1 · 01 JAN 2026",
      manchete: "manchete",
      desenho: desenhoDe("rev-x-lote-1-y"),
    };
    expect(htmlDoCard(entrada)).toBe(htmlDoCard(entrada));
  });
});
