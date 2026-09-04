/**
 * Guarda de contraste sobre os tokens de cor. A paleta carrega significado editorial (a cor
 * da aresta é a família da relação, a da classe é a força da evidência), então perder
 * contraste é perder o canal, não só o acabamento. Limiares da WCAG 2.1: 4.5:1 para texto
 * normal, 3:1 para objeto gráfico.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** Extrai os tokens de um bloco de seletor, na ordem em que aparecem no arquivo. */
function tokens(seletor: string): Record<string, string> {
  const i = CSS.indexOf(seletor);
  if (i < 0) throw new Error(`bloco não encontrado: ${seletor}`);
  const abre = CSS.indexOf("{", i);
  const fecha = CSS.indexOf("\n}", abre);
  const corpo = CSS.slice(abre, fecha);
  const out: Record<string, string> = {};
  for (const m of corpo.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

function canal(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`hex inválido: ${hex}`);
  const n = parseInt(m[1], 16);
  return (
    0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255)
  );
}

function razao(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Cor efetiva de uma aresta em repouso: a família é desenhada com alpha sobre o fundo. */
function comAlpha(hex: string, alpha: number, fundo: string): string {
  const n = parseInt(hex.slice(1), 16);
  const f = parseInt(fundo.slice(1), 16);
  const mistura = (deslocamento: number) => {
    const c = ((n >> deslocamento) & 255) * alpha + ((f >> deslocamento) & 255) * (1 - alpha);
    return Math.round(c).toString(16).padStart(2, "0");
  };
  return `#${mistura(16)}${mistura(8)}${mistura(0)}`;
}

const FAMILIAS = [
  "--rel-institutional",
  "--rel-financial",
  "--rel-political",
  "--rel-social",
  "--rel-professional",
  "--rel-corporate",
  "--rel-allegation",
];
const NOS = [
  "--node-person",
  "--node-organization",
  "--node-public-body",
  "--node-financial",
  "--node-document",
  "--node-source",
  "--node-claim",
  "--node-evidence",
  "--node-party",
  "--node-event",
  "--node-public-act",
];
const EVIDENCIAS = ["--ev-d", "--ev-c", "--ev-a", "--ev-i"];

const TEMAS: [string, string][] = [
  ["escuro", ":root {"],
  ["claro", ':root[data-theme="light"] {'],
];

describe.each(TEMAS)("tema %s", (_nome, seletor) => {
  const t = tokens(seletor);

  it("texto sobre as três superfícies passa em 4.5:1", () => {
    for (const fg of ["--fg", "--fg-2", "--fg-3", "--accent"])
      for (const bg of ["--bg", "--bg-2", "--bg-3"])
        expect(razao(t[fg], t[bg]), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it("limite de controle passa em 3:1 (WCAG 1.4.11)", () => {
    for (const bg of ["--bg", "--bg-2", "--bg-3"])
      expect(razao(t["--border-strong"], t[bg]), `borda sobre ${bg}`).toBeGreaterThanOrEqual(3);
  });

  it("nós do grafo passam em 3:1 sobre o fundo do canvas", () => {
    for (const n of NOS) expect(razao(t[n], t["--bg"]), n).toBeGreaterThanOrEqual(3);
  });

  it("famílias de relação passam em 3:1 no estado de repouso, já com o alpha da aresta", () => {
    const alpha = Number(t["--edge-alpha"]);
    expect(alpha).toBeGreaterThan(0);
    for (const f of FAMILIAS)
      expect(razao(comAlpha(t[f], alpha, t["--bg"]), t["--bg"]), f).toBeGreaterThanOrEqual(3);
  });

  it("classes de evidência passam em 4.5:1 (aparecem como texto no badge)", () => {
    for (const e of EVIDENCIAS)
      for (const bg of ["--bg", "--bg-2", "--bg-3"])
        expect(razao(t[e], t[bg]), `${e} sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});

describe("paridade entre os temas", () => {
  it("o bloco claro define exatamente os mesmos tokens que o escuro", () => {
    const escuro = Object.keys(tokens(":root {")).sort();
    const claro = Object.keys(tokens(':root[data-theme="light"] {')).sort();
    expect(claro).toEqual(escuro);
  });

  it("a variante que segue o sistema repete os valores da escolha explícita", () => {
    const explicito = tokens(':root[data-theme="light"] {');
    const doSistema = tokens(':root:not([data-theme="dark"]) {');
    expect(doSistema).toEqual(explicito);
  });
});
