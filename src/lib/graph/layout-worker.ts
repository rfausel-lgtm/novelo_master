/**
 * Reorganização opcional via ForceAtlas2 em Web Worker (graphology). As
 * posições pré-calculadas no build são o padrão; o worker só roda quando o
 * visitante pede "Reorganizar", por alguns segundos, e então para.
 */
import type Graph from "graphology";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";

export interface LayoutRunner {
  /** Inicia por `durationMs` e para sozinho. */
  run(durationMs?: number): void;
  stop(): void;
  isRunning(): boolean;
  kill(): void;
}

export function createLayoutRunner(graph: Graph, onStop?: () => void): LayoutRunner {
  if (graph.order === 0) {
    return { run() {}, stop() {}, isRunning: () => false, kill() {} };
  }
  const settings = forceAtlas2.inferSettings(graph);
  const layout = new FA2Layout(graph, {
    settings: { ...settings, gravity: 1, scalingRatio: 8, barnesHutOptimize: graph.order > 800, slowDown: 2 },
  });
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stop = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (layout.isRunning()) layout.stop();
    onStop?.();
  };

  return {
    run(durationMs = 4000) {
      if (layout.isRunning()) return;
      layout.start();
      timer = setTimeout(stop, durationMs);
    },
    stop,
    isRunning: () => layout.isRunning(),
    kill() {
      if (timer) clearTimeout(timer);
      layout.kill();
    },
  };
}
