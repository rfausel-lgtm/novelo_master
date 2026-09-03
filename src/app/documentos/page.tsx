import type { Metadata } from "next";
import Link from "next/link";
import { allDocuments } from "@/lib/data";
import { pageMetadata } from "@/lib/pages";
import { DOCUMENT_TYPE_LABEL_SAFE } from "@/lib/labels";
import { formatPartialDate } from "@/lib/format";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { EmptyState } from "@/components/entity/Section";

export const metadata: Metadata = pageMetadata({
  title: "Documentos",
  description: "Decisões, relatórios oficiais, atas, comunicações e demais documentos que sustentam as evidências do corpus.",
  path: "/documentos",
});

export default function DocumentosPage() {
  const docs = allDocuments();
  return (
    <PageShell>
      <PageTitle eyebrow="Índice" title="Documentos" lede="Documentos primários e comunicações oficiais que sustentam as evidências de classe D. Cada documento indica emissor, data, referência e onde é usado." />
      {docs.length === 0 ? (
        <EmptyState>Nenhum documento publicado ainda.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Lista de documentos</caption>
            <thead className="text-fg-3 text-xs uppercase">
              <tr className="border-border border-b">
                <th scope="col" className="py-2 pr-3">Data</th>
                <th scope="col" className="py-2 pr-3">Documento</th>
                <th scope="col" className="py-2 pr-3">Tipo</th>
                <th scope="col" className="py-2 pr-3">Emissor</th>
                <th scope="col" className="py-2">Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="text-fg-3 py-2 pr-3 font-mono text-xs whitespace-nowrap">{d.date ? formatPartialDate(d.date, d.date_precision) : "s/d"}</td>
                  <td className="py-2 pr-3">
                    <Link href={`/documentos/${d.id}`} className="text-fg hover:text-accent underline-offset-2 hover:underline">
                      {d.title}
                    </Link>
                  </td>
                  <td className="text-fg-2 py-2 pr-3 text-xs">{DOCUMENT_TYPE_LABEL_SAFE(d.doc_type)}</td>
                  <td className="text-fg-2 py-2 pr-3 text-xs">{d.issuer ?? ""}</td>
                  <td className="text-fg-2 py-2 text-xs">{d.is_official ? "sim" : "não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
