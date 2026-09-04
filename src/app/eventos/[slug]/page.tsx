import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allEvents, getEvent, getEvidence, getPublicAct, participantsOf, entityHref } from "@/lib/data";
import { eventJsonLd, excerptOf, nearbyOf, pageMetadata, sourcesByIds , safeJsonLd } from "@/lib/pages";
import { EVENT_TYPE_LABEL, DOCUMENT_TYPE_LABEL_SAFE } from "@/lib/labels";
import { formatPartialDate } from "@/lib/format";
import { getDocument } from "@/lib/data";
import { PageShell } from "@/components/entity/PageShell";
import { Breadcrumbs } from "@/components/entity/Breadcrumbs";
import { Section, SectionNav, EmptyState } from "@/components/entity/Section";
import { Lugar } from "@/components/entity/Lugar";
import { EvidenceBadge, StatusBadge, Pill } from "@/components/entity/badges";
import { SourceList } from "@/components/entity/SourceList";
import { CitedPositionBlock } from "@/components/entity/CitedPosition";
import { NearbyList } from "@/components/entity/NearbyList";

export const dynamicParams = false;

export function generateStaticParams() {
  return allEvents().map((e) => ({ slug: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = getEvent(slug);
  if (!e) return {};
  return pageMetadata({ title: e.title, description: excerptOf(e.description), path: `/eventos/${e.id}`, type: "article" });
}

const NAV = [
  { id: "descricao", label: "Descrição" },
  { id: "participantes", label: "Participantes" },
  { id: "evidencias", label: "Evidências" },
  { id: "documentos", label: "Documentos" },
  { id: "fontes", label: "Fontes" },
  { id: "posicao", label: "Posição dos envolvidos" },
  { id: "antes-depois", label: "Antes e depois" },
];

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();
  const participants = participantsOf(event);
  const evidences = event.evidence_ids.map(getEvidence).filter((e): e is NonNullable<typeof e> => !!e);
  const sourceIds = new Set(event.source_ids);
  evidences.forEach((e) => e.source_ids.forEach((s) => sourceIds.add(s)));
  const sources = sourcesByIds([...sourceIds]);
  const docs = event.document_ids.map(getDocument).filter((d): d is NonNullable<typeof d> => !!d);
  const acts = event.public_act_ids.map(getPublicAct).filter((a): a is NonNullable<typeof a> => !!a);
  const nearby = nearbyOf(event.id, event.date);

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(eventJsonLd(event)) }} />
      <Breadcrumbs items={[{ href: "/eventos", label: "Eventos" }, { label: event.title }]} />
      <header className="mb-6">
        <p className="text-fg-3 font-mono text-[11px] tracking-[0.2em] uppercase">Evento · {EVENT_TYPE_LABEL[event.event_type]}</p>
        <h1 className="text-fg mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{event.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill>
            <time dateTime={event.date}>{formatPartialDate(event.date, event.date_precision)}</time>
            {event.end_date ? ` – ${formatPartialDate(event.end_date)}` : ""}
          </Pill>
          {event.location && <Pill>{event.location}</Pill>}
          <EvidenceBadge cls={event.evidence_class} />
          <StatusBadge status={event.status} />
          <Link href={`/grafo?n=${event.id}`} className="bg-accent text-bg hover:bg-accent/90 inline-flex h-8 items-center rounded-md px-3 text-sm font-medium">
            Ver no grafo
          </Link>
        </div>
        {event.place && (
          <div className="mt-4 max-w-md">
            <Lugar place={event.place} />
          </div>
        )}
      </header>
      <SectionNav items={NAV} />

      <Section id="descricao" title="Descrição">
        <p className="prose-novelo text-fg-2 text-sm leading-relaxed sm:text-base">{event.description}</p>
        {acts.length > 0 && (
          <p className="text-fg-3 mt-2 text-xs">
            Atos públicos ligados:{" "}
            {acts.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ", "}
                <Link href={`/atos/${a.id}`} className="hover:text-fg underline-offset-2 hover:underline">
                  {a.title}
                </Link>
              </span>
            ))}
          </p>
        )}
      </Section>

      <Section id="participantes" title="Participantes" count={participants.length}>
        {participants.length === 0 ? (
          <EmptyState>Nenhum participante registrado.</EmptyState>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <li key={p.id}>
                <Link href={entityHref(p.id)} className="border-border text-fg hover:border-fg-3 rounded border px-2.5 py-1 text-sm">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
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
                {(e.attributed_to || e.attributed_to_id) && <p className="text-fg-3 mt-1 text-xs">Atribuída a: {e.attributed_to ?? e.attributed_to_id}</p>}
                {e.inference_basis && <p className="text-fg-3 mt-1 text-xs">Base da inferência: {e.inference_basis}</p>}
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
                <span className="text-fg-3 ml-2 text-xs">
                  {DOCUMENT_TYPE_LABEL_SAFE(d.doc_type)}
                  {d.is_official ? " · oficial" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="fontes" title="Fontes" count={sources.length}>
        <SourceList sources={sources} />
      </Section>

      <Section id="posicao" title="Posição dos envolvidos">
        <CitedPositionBlock positions={event.cited_position} title="Posição dos envolvidos" />
      </Section>

      <Section id="antes-depois" title="Antes e depois" description="Eventos, atos públicos e transações do corpus até 90 dias antes e depois desta data.">
        <NearbyList nearby={nearby} />
      </Section>
    </PageShell>
  );
}
