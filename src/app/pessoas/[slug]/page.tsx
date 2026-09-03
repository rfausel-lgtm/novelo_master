import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPeople, getPerson } from "@/lib/data";
import { excerptOf, pageMetadata, personJsonLd , safeJsonLd } from "@/lib/pages";
import { PageShell } from "@/components/entity/PageShell";
import { Breadcrumbs } from "@/components/entity/Breadcrumbs";
import { AgentDossier } from "@/components/entity/AgentDossier";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPeople().map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPerson(slug);
  if (!p) return {};
  return pageMetadata({ title: p.name, description: excerptOf(p.why_in_novelo), path: `/pessoas/${p.id}`, type: "article" });
}

export default async function PessoaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(personJsonLd(person)) }} />
      <Breadcrumbs items={[{ href: "/pessoas", label: "Pessoas" }, { label: person.name }]} />
      <AgentDossier entity={person} />
    </PageShell>
  );
}
