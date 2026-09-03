import type { Metadata } from "next";
import { allSources, isOfficialSource, usagesOfSource } from "@/lib/data";
import { pageMetadata } from "@/lib/pages";
import { SOURCE_TYPE_LABEL } from "@/lib/labels";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { SourcesTable } from "@/components/entity/SourcesTable";

export const metadata: Metadata = pageMetadata({
  title: "Fontes",
  description: "Auditoria das fontes do corpus: origem, tipo, data, URL, verificação e o que cada fonte sustenta.",
  path: "/fontes",
});

export default function FontesPage() {
  const rows = allSources().map((s) => {
    const u = usagesOfSource(s.id);
    return {
      id: s.id,
      title: s.title,
      publisher: s.publisher,
      type: s.source_type,
      typeLabel: SOURCE_TYPE_LABEL[s.source_type],
      official: isOfficialSource(s),
      date: s.publication_date ?? "",
      verified: !!s.verification,
      uses: u.evidence.length + u.events.length + u.publicActs.length + u.relationships.length + u.claims.length + u.transactions.length,
      url: s.url,
    };
  });
  const official = rows.filter((r) => r.official).length;
  return (
    <PageShell>
      <PageTitle eyebrow="Auditoria" title="Fontes" lede={`${rows.length} fontes, ${official} primárias oficiais. Toda informação publicada aponta para uma fonte verificável; cada fonte mostra o que sustenta.`} />
      <SourcesTable rows={rows} />
    </PageShell>
  );
}
