import type { Metadata } from "next";
import { allPeople } from "@/lib/data";
import { pageMetadata } from "@/lib/pages";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { AgentIndex } from "@/components/entity/AgentIndex";

export const metadata: Metadata = pageMetadata({
  title: "Pessoas",
  description: "Pessoas mencionadas em documentos públicos relacionados ao caso Banco Master, com fontes, evidências e posição do citado.",
  path: "/pessoas",
});

export default function PessoasPage() {
  const people = allPeople();
  return (
    <PageShell>
      <PageTitle eyebrow="Índice" title="Pessoas" lede="Cada pessoa tem um dossiê com linha do tempo, conexões, evidências, fontes e posição do citado. Estar aqui não implica ilicitude: a inclusão decorre de menção em documento público relevante ao caso." />
      <AgentIndex entities={people} basePath="/pessoas" />
    </PageShell>
  );
}
