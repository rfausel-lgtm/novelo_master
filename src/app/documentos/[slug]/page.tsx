import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allDocuments, getDocument, usagesOfDocument, entityHref, entityName } from "@/lib/data";
import { articleJsonLd, excerptOf, pageMetadata, sourcesByIds , safeJsonLd } from "@/lib/pages";
import { DOCUMENT_TYPE_LABEL_SAFE } from "@/lib/labels";
import { formatPartialDate } from "@/lib/format";
import { PageShell } from "@/components/entity/PageShell";
import { Breadcrumbs } from "@/components/entity/Breadcrumbs";
import { Section, EmptyState } from "@/components/entity/Section";
import { EvidenceBadge, Pill } from "@/components/entity/badges";
import { SourceList } from "@/components/entity/SourceList";

export const dynamicParams = false;

export function generateStaticParams() {
  return allDocuments().map((d) => ({ slug: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = getDocument(slug);
  if (!d) return {};
  return pageMetadata({ title: d.title, description: excerptOf(d.summary), path: `/documentos/${d.id}`, type: "article" });
}

function LinkList({ items, base }: { items: { id: string; title: string }[]; base: string }) {
  if (items.length === 0) return <EmptyState>Nenhum.</EmptyState>;
  return (
    <ul className="space-y-1 text-sm">
      {items.map((i) => (
        <li key={i.id}>
          <Link href={`${base}/${i.id}`} className="text-fg hover:text-accent underline-offset-2 hover:underline">
            {i.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function DocumentoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDocument(slug);
  if (!doc) notFound();
  const uses = usagesOfDocument(doc.id);
  const sources = sourcesByIds(doc.source_ids);
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd({ title: doc.title, description: excerptOf(doc.summary), path: `/documentos/${doc.id}`, dateModified: doc.updated_at })) }} />
      <Breadcrumbs items={[{ href: "/documentos", label: "Documentos" }, { label: doc.title }]} />
      <header className="mb-6">
        <p className="text-fg-3 font-mono text-[11px] tracking-[0.2em] uppercase">Documento · {DOCUMENT_TYPE_LABEL_SAFE(doc.doc_type)}</p>
        <h1 className="text-fg mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{doc.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {doc.date && <Pill>{formatPartialDate(doc.date, doc.date_precision)}</Pill>}
          {doc.reference && <Pill>{doc.reference}</Pill>}
          {doc.is_official && <Pill color="var(--rel-financial)">Documento oficial</Pill>}
          {(doc.issuer_id || doc.issuer) && (
            <Pill>
              emissor:{" "}
              {doc.issuer_id ? (
                <Link href={entityHref(doc.issuer_id)} className="text-fg hover:text-accent">
                  {entityName(doc.issuer_id)}
                </Link>
              ) : (
                doc.issuer
              )}
            </Pill>
          )}
          {doc.url && (
            <a href={doc.url} rel="noopener noreferrer" target="_blank" className="text-fg-3 hover:text-accent text-xs underline-offset-2 hover:underline">
              abrir original ↗
            </a>
          )}
        </div>
      </header>
      <Section id="resumo" title="Resumo">
        <p className="prose-novelo text-fg-2 text-sm leading-relaxed sm:text-base">{doc.summary}</p>
        {doc.excerpt && <blockquote className="border-accent/50 text-fg-2 mt-3 border-l-2 pl-4 text-sm italic">{doc.excerpt}</blockquote>}
        {doc.raw_path && <p className="text-fg-3 mt-2 text-xs">Cópia/descrição no repositório: {doc.raw_path}</p>}
        {doc.sha256 && <p className="text-fg-3 mt-1 font-mono text-[11px] break-all">sha256 {doc.sha256}</p>}
      </Section>
      <Section id="evidencias" title="Evidências que este documento sustenta" count={uses.evidence.length}>
        {uses.evidence.length === 0 ? (
          <EmptyState>Nenhuma evidência ligada.</EmptyState>
        ) : (
          <ul className="space-y-2 text-sm">
            {uses.evidence.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start gap-2">
                <EvidenceBadge cls={e.classification} />
                <span className="text-fg-2">{e.proposition}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section id="uso" title="Onde este documento é usado">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-fg mb-2 text-sm font-semibold">Eventos</h3>
            <LinkList items={uses.events} base="/eventos" />
          </div>
          <div>
            <h3 className="text-fg mb-2 text-sm font-semibold">Atos públicos</h3>
            <LinkList items={uses.publicActs} base="/atos" />
          </div>
          <div>
            <h3 className="text-fg mb-2 text-sm font-semibold">Relações</h3>
            {uses.relationships.length === 0 ? (
              <EmptyState>Nenhuma.</EmptyState>
            ) : (
              <ul className="space-y-1 text-sm">
                {uses.relationships.map((r) => (
                  <li key={r.id} className="text-fg-2">
                    <Link href={entityHref(r.from_id)} className="text-fg hover:text-accent">
                      {entityName(r.from_id)}
                    </Link>{" "}
                    · {r.label} ·{" "}
                    <Link href={entityHref(r.to_id)} className="text-fg hover:text-accent">
                      {entityName(r.to_id)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-fg mb-2 text-sm font-semibold">Entidades relacionadas</h3>
            {doc.related_entity_ids.length === 0 ? (
              <EmptyState>Nenhuma.</EmptyState>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {doc.related_entity_ids.map((id) => (
                  <li key={id}>
                    <Link href={entityHref(id)} className="border-border text-fg hover:border-fg-3 rounded border px-2.5 py-1 text-sm">
                      {entityName(id)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>
      <Section id="fontes" title="Obtido por meio de" count={sources.length}>
        <SourceList sources={sources} />
      </Section>
    </PageShell>
  );
}
