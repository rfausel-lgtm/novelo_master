import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allPublicActs, getPublicAct, getEvidence, getDocument, entityHref, entityName } from "@/lib/data";
import { excerptOf, nearbyOf, pageMetadata, sourcesByIds, articleJsonLd , safeJsonLd } from "@/lib/pages";
import { PUBLIC_ACT_TYPE_LABEL, DOCUMENT_TYPE_LABEL_SAFE } from "@/lib/labels";
import { formatPartialDate } from "@/lib/format";
import { PageShell } from "@/components/entity/PageShell";
import { Breadcrumbs } from "@/components/entity/Breadcrumbs";
import { Section, SectionNav, EmptyState } from "@/components/entity/Section";
import { EvidenceBadge, StatusBadge, Pill } from "@/components/entity/badges";
import { SourceList } from "@/components/entity/SourceList";
import { NearbyList } from "@/components/entity/NearbyList";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPublicActs().map((a) => ({ slug: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getPublicAct(slug);
  if (!a) return {};
  return pageMetadata({ title: a.title, description: excerptOf(a.description), path: `/atos/${a.id}`, type: "article" });
}

export default async function AtoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const act = getPublicAct(slug);
  if (!act) notFound();
  const evidences = act.evidence_ids.map(getEvidence).filter((e): e is NonNullable<typeof e> => !!e);
  const sourceIds = new Set(act.source_ids);
  evidences.forEach((e) => e.source_ids.forEach((s) => sourceIds.add(s)));
  const sources = sourcesByIds([...sourceIds]);
  const docs = act.document_ids.map(getDocument).filter((d): d is NonNullable<typeof d> => !!d);
  const nearby = nearbyOf(act.id, act.date);
  const people = (ids: string[]) =>
    ids.length === 0 ? (
      <EmptyState>Não informado.</EmptyState>
    ) : (
      <ul className="flex flex-wrap gap-2">
        {ids.map((id) => (
          <li key={id}>
            <Link href={entityHref(id)} className="border-border text-fg hover:border-fg-3 rounded border px-2.5 py-1 text-sm">
              {entityName(id)}
            </Link>
          </li>
        ))}
      </ul>
    );

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd({ title: act.title, description: excerptOf(act.description), path: `/atos/${act.id}`, dateModified: act.updated_at })) }} />
      <Breadcrumbs items={[{ href: "/atos", label: "Atos públicos" }, { label: act.title }]} />
      <header className="mb-6">
        <p className="text-fg-3 font-mono text-[11px] tracking-[0.2em] uppercase">Ato público · {PUBLIC_ACT_TYPE_LABEL[act.act_type]}</p>
        <h1 className="text-fg mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{act.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill>
            <time dateTime={act.date}>{formatPartialDate(act.date, act.date_precision)}</time>
          </Pill>
          {act.reference && <Pill>{act.reference}</Pill>}
          <EvidenceBadge cls={act.evidence_class} />
          <StatusBadge status={act.status} />
          {act.url && (
            <a href={act.url} rel="noopener noreferrer" target="_blank" className="text-fg-3 hover:text-accent text-xs underline-offset-2 hover:underline">
              documento original ↗
            </a>
          )}
          <Link href={`/grafo?n=${act.id}`} className="bg-accent text-bg hover:bg-accent/90 inline-flex h-8 items-center rounded-md px-3 text-sm font-medium">
            Ver no grafo
          </Link>
        </div>
      </header>
      <SectionNav
        items={[
          { id: "descricao", label: "Descrição" },
          { id: "agentes", label: "Agentes" },
          { id: "evidencias", label: "Evidências" },
          { id: "documentos", label: "Documentos" },
          { id: "fontes", label: "Fontes" },
          { id: "antes-depois", label: "Antes e depois" },
        ]}
      />
      <Section id="descricao" title="Descrição">
        <p className="prose-novelo text-fg-2 text-sm leading-relaxed sm:text-base">{act.description}</p>
        {(act.issuer_id || act.issuer) && (
          <p className="text-fg-3 mt-2 text-xs">
            Emissor:{" "}
            {act.issuer_id ? (
              <Link href={entityHref(act.issuer_id)} className="hover:text-fg underline-offset-2 hover:underline">
                {entityName(act.issuer_id)}
              </Link>
            ) : (
              act.issuer
            )}
          </p>
        )}
      </Section>
      <Section id="agentes" title="Agentes">
        <h3 className="text-fg mb-2 text-sm font-semibold">Praticaram ou assinaram</h3>
        {people(act.actor_ids)}
        <h3 className="text-fg mt-4 mb-2 text-sm font-semibold">Afetados ou beneficiados, segundo os documentos</h3>
        {people(act.affected_ids)}
      </Section>
      <Section id="evidencias" title="Evidências" count={evidences.length}>
        {evidences.length === 0 ? (
          <EmptyState>Nenhuma evidência ligada diretamente.</EmptyState>
        ) : (
          <ul className="space-y-2 text-sm">
            {evidences.map((e) => (
              <li key={e.id} className="border-border rounded border px-3 py-2">
                <div className="flex flex-wrap items-start gap-2">
                  <EvidenceBadge cls={e.classification} />
                  <p className="text-fg-2 flex-1">{e.proposition}</p>
                </div>
                {e.excerpt && <blockquote className="text-fg-3 border-border mt-1 border-l pl-3 text-xs italic">{e.excerpt}</blockquote>}
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section id="documentos" title="Documentos" count={docs.length}>
        {docs.length === 0 ? (
          <EmptyState>Nenhum documento ligado.</EmptyState>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {docs.map((d) => (
              <li key={d.id} className="py-2">
                <Link href={`/documentos/${d.id}`} className="text-fg hover:text-accent font-medium underline-offset-2 hover:underline">
                  {d.title}
                </Link>
                <span className="text-fg-3 ml-2 text-xs">{DOCUMENT_TYPE_LABEL_SAFE(d.doc_type)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section id="fontes" title="Fontes" count={sources.length}>
        <SourceList sources={sources} />
      </Section>
      <Section id="antes-depois" title="Antes e depois" description="Eventos, atos públicos e transações do corpus até 90 dias antes e depois desta data.">
        <NearbyList nearby={nearby} />
      </Section>
    </PageShell>
  );
}
