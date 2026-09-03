import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allOrganizations, getOrganization } from "@/lib/data";
import { excerptOf, organizationJsonLd, pageMetadata , safeJsonLd } from "@/lib/pages";
import { PageShell } from "@/components/entity/PageShell";
import { Breadcrumbs } from "@/components/entity/Breadcrumbs";
import { AgentDossier } from "@/components/entity/AgentDossier";

export const dynamicParams = false;

export function generateStaticParams() {
  return allOrganizations().map((o) => ({ slug: o.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = getOrganization(slug);
  if (!o) return {};
  return pageMetadata({ title: o.name, description: excerptOf(o.why_in_novelo), path: `/organizacoes/${o.id}`, type: "article" });
}

export default async function OrganizacaoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = getOrganization(slug);
  if (!org) notFound();
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd(org)) }} />
      <Breadcrumbs items={[{ href: "/organizacoes", label: "Organizações" }, { label: org.name }]} />
      <AgentDossier entity={org} />
    </PageShell>
  );
}
