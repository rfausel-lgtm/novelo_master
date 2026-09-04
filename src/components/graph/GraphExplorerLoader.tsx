"use client";

import dynamic from "next/dynamic";
import { Legend } from "./Legend";

/** O Sigma depende de WebGL; o explorador é carregado apenas no cliente. */
export const GraphExplorerLoader = dynamic(() => import("./GraphExplorer").then((m) => m.GraphExplorer), {
  ssr: false,
  /*
   * A primeira impressão do produto era uma tela vazia com um texto de 14px enquanto quase 1 MB de
   * grafo baixava. Aqui o tempo morto vira tempo útil: o leitor aprende a ler o mapa esperando.
   */
  loading: () => (
    <div className="flex h-full items-center justify-center p-6" role="status" aria-live="polite">
      <div className="w-full max-w-sm">
        <p className="text-fg text-sm font-medium">Montando o novelo…</p>
        <p className="text-fg-3 mt-1 text-xs">
          O mapa inteiro é baixado de uma vez para funcionar sem servidor. Enquanto isso, como lê-lo:
        </p>
        <div className="border-border mt-4 border-t pt-4">
          <Legend compact />
        </div>
      </div>
    </div>
  ),
});
