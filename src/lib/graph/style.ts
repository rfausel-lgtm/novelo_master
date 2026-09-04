/**
 * Estilo visual do grafo. Cor = natureza da relação (família); forma = força
 * da evidência (D sólida, C sólida fina, A tracejada, I pontilhada).
 * Cores lidas das variáveis CSS em runtime, com fallback idêntico a globals.css.
 * Nunca usar vermelho como sinal de ilícito.
 */
import type { EvidenceClass, RelationshipFamily } from "@/lib/schema";
import type { NodeCategory } from "./types";

export const FAMILY_COLOR_FALLBACK: Record<RelationshipFamily, string> = {
  institutional: "#4c8dff",
  financial: "#4dbf91",
  political: "#e69b45",
  social: "#a77bf3",
  professional: "#9aa4b1",
  corporate: "#3ec9c9",
  allegation: "#c9a04c",
};

export const NODE_COLOR_FALLBACK: Record<NodeCategory, string> = {
  person: "#f4f6f8",
  company: "#4c8dff",
  party: "#e69b45",
  public_body: "#7fa9ff",
  financial_institution: "#4dbf91",
  organization_other: "#4c8dff",
  event: "#c9a04c",
  public_act: "#bfa6e8",
  transaction: "#4dbf91",
  document: "#b8c2cf",
  source: "#79b8ff",
  claim: "#e69b45",
  evidence: "#d7c67a",
};

export const EVIDENCE_COLOR_FALLBACK: Record<EvidenceClass, string> = {
  D: "#4dbf91",
  C: "#4c8dff",
  A: "#e69b45",
  I: "#7b8592",
};

export const FAMILY_VAR: Record<RelationshipFamily, string> = {
  institutional: "--rel-institutional",
  financial: "--rel-financial",
  political: "--rel-political",
  social: "--rel-social",
  professional: "--rel-professional",
  corporate: "--rel-corporate",
  allegation: "--rel-allegation",
};

export const NODE_VAR: Record<NodeCategory, string> = {
  person: "--node-person",
  company: "--node-organization",
  party: "--node-party",
  public_body: "--node-public-body",
  financial_institution: "--node-financial",
  organization_other: "--node-organization",
  event: "--node-event",
  public_act: "--node-public-act",
  transaction: "--node-financial",
  document: "--node-document",
  source: "--node-source",
  claim: "--node-claim",
  evidence: "--node-evidence",
};

export const EVIDENCE_VAR: Record<EvidenceClass, string> = {
  D: "--ev-d",
  C: "--ev-c",
  A: "--ev-a",
  I: "--ev-i",
};

export interface Palette {
  bg: string;
  fg: string;
  fg2: string;
  fg3: string;
  accent: string;
  family: Record<RelationshipFamily, string>;
  node: Record<NodeCategory, string>;
  evidence: Record<EvidenceClass, string>;
  /** Tons do canvas que mudam com o tema (o WebGL não lê variáveis CSS). */
  dimNode: string;
  dimNodeLabel: string;
  dimEdge: string;
  hoverBg: string;
  hoverBorder: string;
  hoverRing: string;
  edgeAlpha: number;
}

export const PALETTE_FALLBACK: Palette = {
  bg: "#090c11",
  fg: "#f4f6f8",
  fg2: "#aab3bf",
  fg3: "#848e9b",
  accent: "#4c8dff",
  family: FAMILY_COLOR_FALLBACK,
  node: NODE_COLOR_FALLBACK,
  evidence: EVIDENCE_COLOR_FALLBACK,
  dimNode: "rgba(70,78,90,0.55)",
  dimNodeLabel: "rgba(139,149,163,0.85)",
  dimEdge: "rgba(120,130,145,0.06)",
  hoverBg: "rgba(17,22,29,0.92)",
  hoverBorder: "#232b36",
  hoverRing: "rgba(244,246,248,0.55)",
  edgeAlpha: 0.65,
};

/** Lê a paleta das variáveis CSS (ou devolve o fallback fora do navegador). */
export function readPalette(): Palette {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function")
    return PALETTE_FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const read = (v: string, fallback: string) => cs.getPropertyValue(v).trim() || fallback;
  const family = { ...FAMILY_COLOR_FALLBACK };
  for (const k of Object.keys(family) as RelationshipFamily[])
    family[k] = read(FAMILY_VAR[k], family[k]);
  const node = { ...NODE_COLOR_FALLBACK };
  for (const k of Object.keys(node) as NodeCategory[]) node[k] = read(NODE_VAR[k], node[k]);
  const evidence = { ...EVIDENCE_COLOR_FALLBACK };
  for (const k of Object.keys(evidence) as EvidenceClass[])
    evidence[k] = read(EVIDENCE_VAR[k], evidence[k]);
  return {
    bg: read("--bg", PALETTE_FALLBACK.bg),
    fg: read("--fg", PALETTE_FALLBACK.fg),
    fg2: read("--fg-2", PALETTE_FALLBACK.fg2),
    fg3: read("--fg-3", PALETTE_FALLBACK.fg3),
    accent: read("--accent", PALETTE_FALLBACK.accent),
    family,
    node,
    evidence,
    dimNode: read("--dim-node", PALETTE_FALLBACK.dimNode),
    dimNodeLabel: read("--dim-node-label", PALETTE_FALLBACK.dimNodeLabel),
    dimEdge: read("--dim-edge", PALETTE_FALLBACK.dimEdge),
    hoverBg: read("--canvas-hover-bg", PALETTE_FALLBACK.hoverBg),
    hoverBorder: read("--canvas-hover-border", PALETTE_FALLBACK.hoverBorder),
    hoverRing: read("--canvas-hover-ring", PALETTE_FALLBACK.hoverRing),
    edgeAlpha: Number(read("--edge-alpha", "")) || PALETTE_FALLBACK.edgeAlpha,
  };
}

/** Nome do "type" da aresta no Sigma (chave em edgeProgramClasses). */
export type EdgeShape = "solid" | "solidShort" | "dashed" | "dotted";

export const EVIDENCE_SHAPE: Record<EvidenceClass, EdgeShape> = {
  D: "solid",
  C: "solidShort",
  A: "dashed",
  I: "dotted",
};

export const EVIDENCE_SHAPE_LABEL: Record<EvidenceClass, string> = {
  D: "linha sólida",
  C: "linha sólida fina",
  A: "linha tracejada",
  I: "linha pontilhada",
};

/** Espessura base (px de tela) por classe: D mais grossa, C fina, A/I médias. */
export const EVIDENCE_EDGE_SIZE: Record<EvidenceClass, number> = {
  D: 1.6,
  C: 0.9,
  A: 1.2,
  I: 1.0,
};

export function edgeTypeFor(cls: EvidenceClass, directed: boolean): string {
  return directed ? `${EVIDENCE_SHAPE[cls]}Arrow` : EVIDENCE_SHAPE[cls];
}

/** Converte #rrggbb em rgba(r,g,b,a). Mantém strings não-hex como estão. */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Tonalidade "apagada" de nós/arestas fora do foco (sem mutar o grafo). */
export const DIM = {
  node: PALETTE_FALLBACK.dimNode,
  nodeLabel: PALETTE_FALLBACK.dimNodeLabel,
  edge: PALETTE_FALLBACK.dimEdge,
} as const;

/*
 * A cor da aresta e o canal semantico do projeto (familia da relacao). Abaixo de 0.65 as sete
 * familias caem para ~2:1 de contraste sobre o fundo, abaixo do minimo de 3:1 da WCAG 1.4.11.
 */
export const EDGE_ALPHA = 0.65;
export const EDGE_ALPHA_ACTIVE = 0.95;
