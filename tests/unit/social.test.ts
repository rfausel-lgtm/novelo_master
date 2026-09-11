import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ArteInvalida, NOME_CANONICO, artesPorRevisao, lerWebp } from "@/lib/social";
import {
  conferirPasta,
  idsDeRevisao,
  nomeCanonico,
  numeroDoLote,
  resolverRevisao,
  selecionarIdsPendentes,
} from "../../scripts/lib/artes";

const arte = (nome: string) => fs.readFileSync(path.join(process.cwd(), "public", "social", nome));

/** Monta um contêiner RIFF/WEBP a partir dos chunks, para exercitar o parser sem arquivo binário. */
function webp(chunks: { tipo: string; corpo: Buffer }[]): Buffer {
  const partes = chunks.flatMap(({ tipo, corpo }) => {
    const cabecalho = Buffer.alloc(8);
    cabecalho.write(tipo, 0, "ascii");
    cabecalho.writeUInt32LE(corpo.length, 4);
    const padding = corpo.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0);
    return [cabecalho, corpo, padding];
  });
  const conteudo = Buffer.concat(partes);
  const cabecalho = Buffer.alloc(12);
  cabecalho.write("RIFF", 0, "ascii");
  cabecalho.writeUInt32LE(4 + conteudo.length, 4);
  cabecalho.write("WEBP", 8, "ascii");
  return Buffer.concat([cabecalho, conteudo]);
}

function vp8x({ largura, altura, flags }: { largura: number; altura: number; flags: number }) {
  const corpo = Buffer.alloc(10);
  corpo.writeUInt8(flags, 0);
  corpo.writeUIntLE(largura - 1, 4, 3);
  corpo.writeUIntLE(altura - 1, 7, 3);
  return { tipo: "VP8X", corpo };
}

describe("lerWebp", () => {
  it("lê dimensões das artes publicadas", () => {
    const a = lerWebp(arte("rev-2026-09-10-lote-165-a-ata-notarial-de-karina-gama.webp"));
    expect(a).toEqual({ width: 1280, height: 853, animado: false });
  });

  it("acusa animação pela flag do VP8X", () => {
    const buf = webp([vp8x({ largura: 800, altura: 600, flags: 0x02 })]);
    expect(lerWebp(buf).animado).toBe(true);
  });

  it("acusa animação pelos chunks ANIM/ANMF, mesmo sem a flag", () => {
    const buf = webp([
      vp8x({ largura: 800, altura: 600, flags: 0x00 }),
      { tipo: "ANIM", corpo: Buffer.alloc(6) },
    ]);
    expect(lerWebp(buf).animado).toBe(true);
  });

  it("acha as dimensões do VP8L depois de um chunk de metadados", () => {
    const vp8l = Buffer.alloc(5);
    vp8l.writeUInt8(0x2f, 0);
    vp8l.writeUInt32LE((639 & 0x3fff) | ((479 & 0x3fff) << 14), 1);
    const buf = webp([
      { tipo: "ICCP", corpo: Buffer.alloc(7) },
      { tipo: "VP8L", corpo: vp8l },
    ]);
    expect(lerWebp(buf)).toEqual({ width: 640, height: 480, animado: false });
  });

  it("recusa o que não é contêiner WebP", () => {
    expect(() => lerWebp(Buffer.from("não sou imagem"))).toThrow(ArteInvalida);
    expect(() => lerWebp(fs.readFileSync("package.json"))).toThrow(ArteInvalida);
  });

  it("recusa RIFF que declara tamanho maior que o arquivo", () => {
    const buf = webp([vp8x({ largura: 800, altura: 600, flags: 0 })]);
    buf.writeUInt32LE(buf.readUInt32LE(4) + 500, 4);
    expect(() => lerWebp(buf)).toThrow(/tamanho RIFF/);
  });

  it("recusa canvas do VP8X divergente do frame interno", () => {
    // O navegador desenha pelo canvas: um VP8X de 2000 px com frame de 799 px passaria no limite
    // de largura lendo só o frame, e apareceria no site com 2000.
    const vp8 = Buffer.alloc(10);
    vp8.writeUInt16LE(799, 6);
    vp8.writeUInt16LE(599, 8);
    const buf = webp([
      vp8x({ largura: 2000, altura: 600, flags: 0 }),
      { tipo: "VP8 ", corpo: vp8 },
    ]);
    expect(() => lerWebp(buf)).toThrow(/canvas 2000x600 diverge do frame 799x599/);
  });

  it("aceita VP8X cujo canvas bate com o frame", () => {
    const vp8 = Buffer.alloc(10);
    vp8.writeUInt16LE(800, 6);
    vp8.writeUInt16LE(600, 8);
    const buf = webp([vp8x({ largura: 800, altura: 600, flags: 0 }), { tipo: "VP8 ", corpo: vp8 }]);
    expect(lerWebp(buf)).toEqual({ width: 800, height: 600, animado: false });
  });

  it("recusa contêiner sem chunk de imagem", () => {
    expect(() => lerWebp(webp([{ tipo: "ICCP", corpo: Buffer.alloc(4) }]))).toThrow(/nenhum chunk/);
  });
});

describe("nome canônico", () => {
  it("aceita só <Revision.id>.webp", () => {
    expect(NOME_CANONICO.test("rev-2026-09-10-lote-165-a-ata-notarial-de-karina-gama.webp")).toBe(
      true,
    );
    expect(NOME_CANONICO.test("lote-165.webp")).toBe(false);
    expect(NOME_CANONICO.test("rev-2026-09-10-lote-165-a-ata.WEBP")).toBe(false);
    expect(NOME_CANONICO.test("rev-2026-09-10-lote-165-a-ata.png")).toBe(false);
    expect(NOME_CANONICO.test("rev-2026-09-10-lote-165--extra.webp")).toBe(false);
  });
});

describe("resolverRevisao", () => {
  it("resolve número de lote com revisão única", () => {
    expect(resolverRevisao("165")).toBe("rev-2026-09-10-lote-165-a-ata-notarial-de-karina-gama");
  });

  it("falha e lista as candidatas quando o número tem mais de uma revisão", () => {
    // 83, 84, 85 e 86 têm duas revisões cada: era o bug da chave por número.
    for (const ambiguo of ["83", "84", "85", "86"]) {
      expect(() => resolverRevisao(ambiguo)).toThrow(/tem 2 revisões/);
    }
  });

  it("não deixa o lote 75 capturar o 75b", () => {
    expect(resolverRevisao("75")).toMatch(/-lote-75-/);
    expect(resolverRevisao("75")).not.toMatch(/-lote-75b-/);
  });

  it("exige id completo para lote com sufixo de letra", () => {
    const id = idsDeRevisao().find((i) => i.includes("-lote-75b-"))!;
    expect(resolverRevisao(id)).toBe(id);
  });

  it("não confunde o lote 13 com o 136", () => {
    expect(resolverRevisao("136")).toMatch(/-lote-136-/);
    expect(() => resolverRevisao("99999")).toThrow(/nenhuma revisão/);
  });

  it("recusa id inexistente em vez de aproximar", () => {
    expect(() => resolverRevisao("rev-2026-09-10-lote-165-a-ata-notarial-de-karina-gamE")).toThrow(
      /inexistente/,
    );
  });

  it("recusa alvo que não é número nem id", () => {
    expect(() => resolverRevisao("lote-165")).toThrow(/inválido/);
  });
});

describe("detector de revisões sem arte", () => {
  it("exige marco explícito e não importa o histórico anterior", () => {
    const ids = [
      "rev-2026-09-11-lote-199-antigo",
      "rev-2026-09-11-lote-200-primeiro",
      "rev-2026-09-11-lote-201-segundo",
    ];
    const artes = new Set(["rev-2026-09-11-lote-201-segundo.webp"]);
    expect(selecionarIdsPendentes(ids, artes, 200)).toEqual([
      { id: "rev-2026-09-11-lote-200-primeiro", lote: 200 },
    ]);
    expect(() => selecionarIdsPendentes(ids, artes, 0)).toThrow(/inteiro positivo/);
  });

  it("não confunde lote numérico com revisão de sufixo", () => {
    expect(numeroDoLote("rev-2026-09-11-lote-200-titulo")).toBe(200);
    expect(numeroDoLote("rev-2026-09-11-lote-200b-titulo")).toBeNull();
  });

  it("mantém todas as revisões distintas do mesmo lote", () => {
    const ids = ["rev-a-lote-200-um", "rev-b-lote-200-dois"];
    expect(selecionarIdsPendentes(ids, new Set(), 200)).toEqual([
      { id: "rev-a-lote-200-um", lote: 200 },
      { id: "rev-b-lote-200-dois", lote: 200 },
    ]);
  });
});

describe("artesPorRevisao", () => {
  it("chaveia pelo Revision.id, e todo id existe em data/revisions/", () => {
    const ids = new Set(idsDeRevisao());
    const artes = artesPorRevisao();
    expect(artes.size).toBeGreaterThan(0);
    for (const [id, a] of artes) {
      expect(ids.has(id)).toBe(true);
      expect(a.src).toBe(`/social/${nomeCanonico(id)}`);
      expect(a.width).toBeGreaterThan(0);
      expect(a.height).toBeGreaterThan(0);
    }
  });

  it("não entrega arte para revisão que não tem — ausência é o estado normal", () => {
    const semArte = idsDeRevisao().filter((id) => !artesPorRevisao().has(id));
    expect(semArte.length).toBeGreaterThan(0);
  });
});

describe("conferirPasta", () => {
  it("a pasta publicada está conforme", () => {
    expect(conferirPasta()).toEqual([]);
  });
});
