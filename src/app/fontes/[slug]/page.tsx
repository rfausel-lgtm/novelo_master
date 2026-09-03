import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allSources, getSource, usagesOfSource, entityHref, entityName, isOfficialSource } from "@/lib/data";
import { articleJsonLd, excerptOf, pageMetadata } from "@/lib/pages";
import { SOURCE_TYPE_LABEL } from "@/lib/labels";
import { formatPartialDate } from "@/lib/format";
import { PageShell } from "@/components/entity/PageShell";
import { Breadcrumbs } from "@/components/entity/Breadcrumbs";
import { Section, EmptyState } from "@/components/entity/Section";
import { EvidenceBadge, OfficialBadge, Pill } from "@/components/entity/badges";

export const dynamicParams = false;

export function generateStaticParams() {
  return allSources().map((s) => ({ slug: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getSource(slug);
  if (!s) return {};
  return pageMetadata({ title: s.title, description: excerptOf(s.summary ?? `${s.publisher}, ${s.title}`), path: `/fontes/${s.id}`, type: "article" });
}

function LinkList({ items, hrefOf }: { items: { id: string; label: string }[]; hrefOf: (id: string) => string }) {
  if (items.length === 0) return <EmptyState>Nenhum.</EmptyState>;
  return (
    <ul className="space-y-1 text-sm">
      {items.map((i) => (
        <li key={i.id}>
          <Link href={hrefOf(i.id)} className="text-fg hover:text-accent underline-offset-2 hover:underline">
            {i.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function FontePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const source = getSource(slug);
  if (!source) notFound();
  const uses = usagesOfSource(source.id);
  const official = isOfficialSource(source);
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd({ title: source.title, description: excerptOf(source.summary ?? source.title), path: `/fontes/${source.id}`, dateModified: source.updated_at })) }} />
      <Breadcrumbs items={[{ href: "/fontes", label: "Fontes" }, { label: source.title }]} />
      <header className="mb-6">
        <p className="text-fg-3 font-mono text-[11px] tracking-[0.2em] uppercase">Fonte · {SOURCE_TYPE_LABEL[source.source_type]}</p>
        <h1 className="text-fg mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{source.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill>{source.publisher}</Pill>
          {source.author && <Pill>{source.author}</Pill>}
          {source.publication_date && <Pill>publicada em {formatPartialDate(source.publication_date)}</Pill>}
          <Pill>capturada em {formatPartialDate(source.retrieved_at)}</Pill>
          <OfficialBadge source={source} />
        </div>
      </header>
      <Section id="acesso" title="Acesso">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-fg-3 text-xs">URL original</dt>
            <dd>
              <a href={source.url} rel="noopener noreferrer" target="_blank" className="text-accent break-all underline underline-offset-2">
                {source.url}
              </a>
            </dd>
          </div>
          {source.archive_url && (
            <div>
              <dt className="text-fg-3 text-xs">Cópia arquivada</dt>
              <dd>
                <a href={source.archive_url} rel="noopener noreferrer" target="_blank" className="text-accent break-all underline underline-offset-2">
                  {source.archive_url}
                </a>
              </dd>
            </div>
          )}
        </dl>
        {source.summary && <p className="text-fg-2 mt-4 text-sm leading-relaxed">{source.summary}</p>}
        {source.notes && <p className="text-fg-3 mt-2 text-xs">{source.notes}</p>}
        <p className="text-fg-3 mt-3 text-xs">
          {official
            ? "Fonte primária oficial: entra no modo \"somente fontes oficiais\" do grafo."
            : "Fonte secundária: sustenta, no máximo, evidências corroboradas (C) ou alegações (A), salvo quando reproduz documento primário lido pela equipe."}
        </p>
      </Section>
      <Section id="verificacao" title="Verificação">
        {source.verification ? (
          <dl className="text-fg-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-fg-3 text-xs">Verificada em</dt>
              <dd>{formatPartialDate(source.verification.checked_at)}</dd>
            </div>
            <div>
              <dt className="text-fg-3 text-xs">Por</dt>
              <dd>{source.verification.checked_by}</dd>
            </div>
            <div>
              <dt className="text-fg-3 text-xs">URL acessível</dt>
              <dd>{source.verification.url_reachable ? "sim" : "não"}</dd>
            </div>
            <div>
              <dt className="text-fg-3 text-xs">Conteúdo confere com o resumo</dt>
              <dd>{source.verification.content_matches_summary ? "sim" : "não"}</dd>
            </div>
            {source.verification.notes && (
              <div className="sm:col-span-2">
                <dt className="text-fg-3 text-xs">Notas</dt>
                <dd>{source.verification.notes}</dd>
              </div>
            )}
          </dl>
        ) : (
          <EmptyState>Fonte ainda não passou pela verificação formal.</EmptyState>
        )}
      </Section>
      <Section id="uso" title="O que esta fonte sustenta">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-fg mb-2 text-sm font-semibold">Evidências</h3>
            {uses.evidence.length === 0 ? (
              <EmptyState>Nenhuma.</EmptyState>
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
          </div>
          <div>
            <h3 className="text-fg mb-2 text-sm font-semibold">Documentos</h3>
            <LinkList items={uses.documents.map((d) => ({ id: d.id, label: d.title }))} hrefOf={(id) => `/documentos/${id}`} />
          </div>
          <div>
            <h3 className="text-fg mb-2 text-sm font-semibold">Eventos</h3>
            <LinkList items={uses.events.map((e) => ({ id: e.id, label: e.title }))} hrefOf={(id) => `/eventos/${id}`} />
          </div>
          <div>
            <h3 className="text-fg mb-2 text-sm font-semibold">Atos públicos</h3>
            <LinkList items={uses.publicActs.map((a) => ({ id: a.id, label: a.title }))} hrefOf={(id) => `/atos/${id}`} />
          </div>
          <div>
            <h3 className="text-fg mb-2 text-sm font-semibold">Pessoas e organizações</h3>
            <LinkList items={[...uses.people, ...uses.organizations].map((p) => ({ id: p.id, label: p.name }))} hrefOf={entityHref} />
          </div>
          <div>
            <h3 className="text-fg mb-2 text-sm font-semibold">Relações derivadas</h3>
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
                    </Link>{" "}
                    <EvidenceBadge cls={r.evidence_class} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
