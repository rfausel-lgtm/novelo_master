import type { Metadata } from "next";
import { Suspense } from "react";
import { GraphExplorerLoader } from "@/components/graph/GraphExplorerLoader";

export const metadata: Metadata = {
  title: "Grafo",
  description:
    "Explore o mapa interativo de relações, eventos, documentos e fontes do caso Banco Master. Cor = natureza da relação; forma = força da evidência.",
};

export default function GrafoPage() {
  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full">
      <h1 className="sr-only">Grafo do Novelo Master</h1>
      <Suspense fallback={<p className="text-fg-3 p-6 text-sm">Carregando o novelo…</p>}>
        <GraphExplorerLoader />
      </Suspense>
    </div>
  );
}
