"use client";

import dynamic from "next/dynamic";

/** O Sigma depende de WebGL; o explorador é carregado apenas no cliente. */
export const GraphExplorerLoader = dynamic(() => import("./GraphExplorer").then((m) => m.GraphExplorer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center" role="status" aria-live="polite">
      <p className="text-fg-3 text-sm">Carregando o novelo…</p>
    </div>
  ),
});
