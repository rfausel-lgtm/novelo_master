"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Logo } from "./Logo";

/**
 * A marca da capa, girando no eixo vertical.
 *
 * Mesma estrutura do logo — anel de nós ligados, com um ponto distinto no meio —, só que os nós
 * ficam distribuídos numa esfera. Um anel plano não serviria: girando em torno do eixo vertical ele
 * vira uma moeda de perfil duas vezes por volta.
 *
 * O SVG estático continua sendo o que o servidor renderiza e o que aparece sem JavaScript ou com
 * movimento reduzido; o canvas entra só depois da hidratação. São ~1,5 KB de código e nenhum
 * arquivo — um GIF exigiria dois arquivos (claro e escuro), com transparência de 1 bit, sem
 * acompanhar a troca de tema.
 */
const RM_QUERY = "(prefers-reduced-motion: reduce)";
function assinarMovimento(cb: () => void) {
  const mq = window.matchMedia(RM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function assinarNada() {
  return () => {};
}

/** Espiral de Fibonacci: distribui na esfera sem aglomerar nos polos. */
const N = 22;
const PONTOS: { X: number; Y: number; Z: number; centro: boolean }[] = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const lon = i * Math.PI * (3 - Math.sqrt(5));
  PONTOS.push({ X: Math.cos(lon) * r, Y: y * 0.92, Z: Math.sin(lon) * r, centro: false });
}
PONTOS.push({ X: 0, Y: 0, Z: 0, centro: true });

const LIGACOES: [number, number][] = [];
for (let i = 0; i < N; i++) {
  LIGACOES.push([i, (i + 1) % N]);
  if (i % 3 === 0) LIGACOES.push([i, (i + 7) % N]);
}

export function LogoAnimado({
  size = 77,
  title = "O Novelo Master",
}: {
  size?: number;
  title?: string;
}) {
  const noCliente = useSyncExternalStore(
    assinarNada,
    () => true,
    () => false,
  );
  const semMovimento = useSyncExternalStore(
    assinarMovimento,
    () => window.matchMedia(RM_QUERY).matches,
    () => false,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* Cores num ref, não em estado: o tema muda pouco e repintar já acontece a cada quadro. */
    const cores = { fg: "#f4f6f8", accent: "#4c8dff", centro: "#4dbf91" };
    const lerCores = () => {
      const cs = getComputedStyle(document.documentElement);
      const ler = (v: string, padrao: string) => cs.getPropertyValue(v).trim() || padrao;
      cores.fg = ler("--fg", cores.fg);
      cores.accent = ler("--accent", cores.accent);
      cores.centro = ler("--rel-financial", cores.centro);
    };
    lerCores();

    const observador = new MutationObserver(lerCores);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", lerCores);

    const R = size * 0.4;
    const c = size / 2;
    const DIST = 3.4;
    let angulo = 0.5;
    let anterior = performance.now();
    let quadro = 0;

    const pintar = () => {
      const sen = Math.sin(angulo);
      const cos = Math.cos(angulo);
      const proj = PONTOS.map((p) => {
        const X = p.X * cos + p.Z * sen;
        const Z = -p.X * sen + p.Z * cos;
        const k = DIST / (DIST - Z);
        return { x: c + X * R * k, y: c - p.Y * R * k, z: Z, k, centro: p.centro };
      });

      ctx.clearRect(0, 0, size, size);
      ctx.lineCap = "round";
      ctx.strokeStyle = cores.accent;
      ctx.lineWidth = Math.max(0.7, size / 62);
      for (const [a, b] of LIGACOES) {
        const p = proj[a];
        const q = proj[b];
        ctx.globalAlpha = Math.max(0.06, 0.22 + 0.45 * (((p.z + q.z) / 2 + 1) / 2));
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }

      proj.sort((a, b) => a.z - b.z);
      for (const p of proj) {
        ctx.globalAlpha = Math.max(0.25, 0.3 + 0.7 * ((p.z + 1) / 2));
        ctx.fillStyle = p.centro ? cores.centro : cores.fg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.9, (size / 34) * p.k * (p.centro ? 1.05 : 1)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const passo = (agora: number) => {
      const dt = Math.min((agora - anterior) / 1000, 0.05);
      anterior = agora;
      angulo += dt * 0.45;
      pintar();
      quadro = requestAnimationFrame(passo);
    };

    /*
     * Um quadro pintado já, antes do laço: requestAnimationFrame não dispara em aba de fundo, e sem
     * isto quem abre o site em segundo plano encontraria a marca em branco ao voltar para a aba.
     */
    pintar();
    quadro = requestAnimationFrame((t) => {
      anterior = t;
      passo(t);
    });

    return () => {
      cancelAnimationFrame(quadro);
      observador.disconnect();
      mq.removeEventListener("change", lerCores);
    };
  }, [size, noCliente, semMovimento]);

  if (!noCliente || semMovimento)
    return <Logo className="shrink-0" title={title} style={{ width: size, height: size }} />;

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={title}
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
