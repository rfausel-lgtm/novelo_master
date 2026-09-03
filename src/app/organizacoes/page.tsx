import type { Metadata } from "next";
import { allOrganizations } from "@/lib/data";
import { pageMetadata } from "@/lib/pages";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { AgentIndex } from "@/components/entity/AgentIndex";

export const metadata: Metadata = pageMetadata({
  title: "Organizações",
  description: "Empresas, instituições financeiras, órgãos públicos, tribunais e partidos presentes no corpus do caso Banco Master.",
  path: "/organizacoes",
});

export default function OrganizacoesPage() {
  return (
    <PageShell>
      <PageTitle eyebrow="Índice" title="Organizações" lede="Empresas, instituições financeiras, órgãos públicos, tribunais, partidos e associações. Cada organização tem um dossiê com relações, eventos, documentos e fontes." />
      <AgentIndex entities={allOrganizations()} basePath="/organizacoes" />
    </PageShell>
  );
}
