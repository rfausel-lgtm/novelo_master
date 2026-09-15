/**
 * Mira com tolerância sobre as arestas do grafo, em pixels de tela.
 *
 * A detecção nativa do Sigma lê um framebuffer em meia resolução: uma linha de ~1 px quase nunca
 * é atingida. Como as arestas são retas, a distância do ponto ao segmento é exata e dispensa o
 * framebuffer. Funções puras: quem chama converte as pontas para coordenadas de tela.
 */
import type { EvidenceClass } from "@/lib/schema";

export interface Ponto {
  x: number;
  y: number;
}

export interface SegmentoDeAresta {
  id: string;
  a: Ponto;
  b: Ponto;
  /** Aresta do contexto em foco (nó selecionado, caminho, seleção): vence dentro da tolerância. */
  prioridade?: boolean;
}

/** Distância euclidiana do ponto `p` ao segmento `ab`, com as extremidades como limite. */
export function distanciaAoSegmento(p: Ponto, a: Ponto, b: Ponto): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comprimento2 = dx * dx + dy * dy;
  /* Segmento degenerado (pontas sobrepostas): vale a distância ao ponto. */
  const t =
    comprimento2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / comprimento2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * A aresta mais próxima de `p` dentro de `tolerancia`. As do contexto em foco têm prioridade: só
 * se nenhuma delas estiver ao alcance vale a mais próxima entre as demais. No empate, fica a que
 * veio primeiro.
 */
export function arestaMaisProxima(
  p: Ponto,
  segmentos: Iterable<SegmentoDeAresta>,
  tolerancia: number,
): string | null {
  let prioritaria: { id: string; d: number } | null = null;
  let qualquer: { id: string; d: number } | null = null;
  for (const s of segmentos) {
    /* Descarte barato antes da conta: o ponto está fora da caixa do segmento com folga. */
    if (
      p.x < Math.min(s.a.x, s.b.x) - tolerancia ||
      p.x > Math.max(s.a.x, s.b.x) + tolerancia ||
      p.y < Math.min(s.a.y, s.b.y) - tolerancia ||
      p.y > Math.max(s.a.y, s.b.y) + tolerancia
    )
      continue;
    const d = distanciaAoSegmento(p, s.a, s.b);
    if (d > tolerancia) continue;
    if (s.prioridade && (!prioritaria || d < prioritaria.d)) prioritaria = { id: s.id, d };
    if (!qualquer || d < qualquer.d) qualquer = { id: s.id, d };
  }
  return (prioritaria ?? qualquer)?.id ?? null;
}

const FORCA_DA_CLASSE: Record<EvidenceClass, number> = { D: 4, C: 3, A: 2, I: 1 };

/** Verdadeiro quando `a` é classe de evidência mais forte que `b` (D > C > A > I). */
export function classeMaisForte(a: EvidenceClass, b: EvidenceClass): boolean {
  return FORCA_DA_CLASSE[a] > FORCA_DA_CLASSE[b];
}
