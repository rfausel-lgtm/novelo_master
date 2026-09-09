import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@/lib/pages";
import { GraphExplorerLoader } from "@/components/graph/GraphExplorerLoader";

/*
 * A canônica não é detalhe aqui: o grafo é client-side, então `/grafo/?n=<id>` e `/grafo/?e=<id>`
 * servem HTML byte-idêntico ao de `/grafo/`. O site publica centenas desses links ("Ver no grafo"
 * em cada dossiê, e o fallback de `entityHref`), e sem a canônica o Google rastreia cada variante
 * como página própria, gasta o orçamento de rastreamento do domínio e depois recusa indexar por
 * duplicidade — foi o que ele fez, e as variantes aparecem nomeadas no Search Console.
 */
export const metadata: Metadata = pageMetadata({
  title: "Grafo",
  description:
    "Explore o mapa interativo de relações, eventos, documentos e fontes do caso Banco Master. Cor = natureza da relação; forma = força da evidência.",
  path: "/grafo",
  type: "website",
});

export default function GrafoPage() {
  return (
    <div className="graph-route h-[calc(100dvh-3.5rem)] w-full">
      <h1 className="sr-only">Grafo do Novelo Master</h1>
      <Suspense fallback={<p className="text-fg-3 p-6 text-sm">Carregando o novelo…</p>}>
        <GraphExplorerLoader />
      </Suspense>
    </div>
  );
}
