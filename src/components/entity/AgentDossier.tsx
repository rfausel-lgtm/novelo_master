import Link from "next/link";
import type { Person, Organization, Relationship, RelationshipFamily } from "@/lib/schema";
import { RELATIONSHIP_FAMILY, RELATIONSHIP_FAMILY_LABEL, TRANSACTION_TYPE_LABEL, DOCUMENT_TYPE_LABEL_SAFE } from "@/lib/labels";
import {
  claimsOf,
  documentsOf,
  entityHref,
  entityName,
  eventsOf,
  evidenceOf,
  getOrganization,
  publicActsOf,
  relationshipsOf,
  sourcesOf,
  transactionsOf,
} from "@/lib/data";
import { formatCurrency, formatPartialDate } from "@/lib/format";
import { EVIDENCE_RANK, officialCount, timelineOf } from "@/lib/pages";
import { EntityHeader } from "./EntityHeader";
import { Section, EmptyState } from "./Section";
import { SectionNavSticky } from "./SectionNavSticky";
import { RelationshipCard } from "./RelationshipCard";
import { Dobra } from "./Dobra";
import { Timeline } from "./Timeline";
import { SourceList } from "./SourceList";
import { CitedPositionBlock, OpenQuestions } from "./CitedPosition";
import { EvidenceBadge, StatusBadge } from "./badges";

const FAMILY_ORDER: RelationshipFamily[] = ["institutional", "corporate", "financial", "political", "professional", "social", "allegation"];

function sortRelationships(rels: Relationship[], selfId: string): Relationship[] {
  return [...rels].sort((a, b) => {
    const r = EVIDENCE_RANK[a.evidence_class] - EVIDENCE_RANK[b.evidence_class];
    if (r !== 0) return r;
    const na = entityName(a.from_id === selfId ? a.to_id : a.from_id);
    const nb = entityName(b.from_id === selfId ? b.to_id : b.from_id);
    return na.localeCompare(nb, "pt-BR");
  });
}

const NAV = [
  { id: "resumo", label: "Resumo" },
  { id: "por-que", label: "Por que está no Novelo?" },
  { id: "posicao", label: "Posição do citado" },
  { id: "lacunas", label: "Lacunas" },
  { id: "linha-do-tempo", label: "Linha do tempo" },
  { id: "conexoes", label: "Principais conexões" },
  { id: "relacoes", label: "Relações por categoria" },
  { id: "negocios", label: "Negócios" },
  { id: "documentos", label: "Documentos" },
  { id: "evidencias", label: "Evidências" },
  { id: "fontes", label: "Fontes" },
  { id: "historico", label: "Histórico" },
];

/** Dossiê completo de pessoa ou organização (14 seções da especificação). */
export function AgentDossier({ entity }: { entity: Person | Organization }) {
  const id = entity.id;
  const rels = sortRelationships(relationshipsOf(id), id);
  const events = eventsOf(id);
  const acts = publicActsOf(id);
  const txs = transactionsOf(id);
  const docs = documentsOf(id);
  const evs = evidenceOf(id);
  const sources = sourcesOf(id);
  const claims = claimsOf(id);
  const timeline = timelineOf(events, acts, txs);
  const official = officialCount(sources);

  const byFamily = new Map<RelationshipFamily, Relationship[]>();
  for (const r of rels) {
    const f = RELATIONSHIP_FAMILY[r.relationship_type];
    byFamily.set(f, [...(byFamily.get(f) ?? []), r]);
  }

  return (
    <article>
      <EntityHeader
        entity={entity}
        counts={[
          { label: "conexões", value: rels.length },
          { label: "eventos", value: events.length + acts.length },
          { label: "fontes oficiais", value: official },
          { label: "evidências", value: evs.length },
        ]}
      />
      {/*
        A partir de lg o sumário vira coluna própria e grudada: numa página de dezenas de milhares
        de pixels ele era o único mapa e sumia nos primeiros 700px de rolagem.
      */}
      <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
        <SectionNavSticky items={NAV} />
        <div>

      <Section id="resumo" title="Resumo">
        <p className="prose-novelo text-fg-2 text-sm leading-relaxed sm:text-base">{entity.summary}</p>
        {entity.kind === "person" && entity.positions.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {entity.positions.map((p, i) => (
              <li key={i} className="text-fg-2">
                <span className="text-fg">{p.title}</span>
                {(p.organization_id || p.organization) && (
                  <>
                    {" · "}
                    {p.organization_id && getOrganization(p.organization_id) ? (
                      <Link href={`/organizacoes/${p.organization_id}`} className="hover:text-accent underline-offset-2 hover:underline">
                        {getOrganization(p.organization_id)!.name}
                      </Link>
                    ) : (
                      p.organization
                    )}
                  </>
                )}
                {(p.start_date || p.end_date) && (
                  <span className="text-fg-3 text-xs">
                    {" "}
                    ({p.start_date ? formatPartialDate(p.start_date) : "?"} – {p.end_date ? formatPartialDate(p.end_date) : "atual"})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {entity.kind === "organization" && (
          <dl className="text-fg-3 mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
            {entity.cnpj && (
              <div>
                <dt className="inline">CNPJ: </dt>
                <dd className="text-fg-2 inline font-mono">{entity.cnpj}</dd>
              </div>
            )}
            {entity.jurisdiction && (
              <div>
                <dt className="inline">Jurisdição: </dt>
                <dd className="text-fg-2 inline">{entity.jurisdiction}</dd>
              </div>
            )}
          </dl>
        )}
      </Section>

      <Section id="por-que" title="Por que está no Novelo?">
        <p className="border-accent/60 bg-bg-2/60 text-fg max-w-[68ch] rounded border-l-2 px-4 py-3 text-sm leading-relaxed sm:text-base">{entity.why_in_novelo}</p>
      </Section>

      <Section id="posicao" title="Posição do citado" description="Negativas, esclarecimentos, notas públicas ou versões apresentadas pela pessoa ou organização. Exibidas sempre, mesmo quando enfraquecem uma hipótese.">
        <CitedPositionBlock positions={entity.cited_position} />
      </Section>

      <Section id="lacunas" title="Lacunas ainda não esclarecidas" description="O que o corpus não demonstra. Se não sabemos, dizemos que não sabemos.">
        <OpenQuestions questions={entity.open_questions} />
      </Section>

      <Section id="linha-do-tempo" title="Linha do tempo" count={timeline.length}>
        <Timeline items={timeline} />
      </Section>

      {/*
        Índice, não repetição: as doze relações mais bem sustentadas em uma linha cada, para saltar
        direto ao dossiê do outro lado. O cartão completo de cada uma está logo abaixo, na seção por
        categoria — antes o mesmo conteúdo era impresso duas vezes na mesma página.
      */}
      <Section id="conexoes" title="Mais bem documentadas" count={Math.min(rels.length, 12)} description="As doze relações com a evidência mais forte. Todas aparecem completas, agrupadas por categoria, na seção seguinte.">
        {rels.length === 0 ? (
          <EmptyState>Nenhuma relação registrada no corpus.</EmptyState>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {rels.slice(0, 12).map((r) => {
              const outro = r.from_id === id ? r.to_id : r.from_id;
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2">
                  <EvidenceBadge cls={r.evidence_class} />
                  <Link href={entityHref(outro)} className="text-fg hover:text-accent font-medium underline-offset-2 hover:underline">
                    {entityName(outro)}
                  </Link>
                  <span className="text-fg-3 text-xs">{r.label}</span>
                  {r.start_date ? <span className="text-fg-3 font-mono text-[11px]">{formatPartialDate(r.start_date)}</span> : null}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section id="relacoes" title="Relações por categoria" count={rels.length}>
        {rels.length === 0 ? (
          <EmptyState>Nenhuma relação registrada no corpus.</EmptyState>
        ) : (
          <div className="space-y-6">
            {FAMILY_ORDER.filter((f) => byFamily.has(f)).map((f) => (
              <div key={f}>
                <h3 className="text-fg mb-2 text-sm font-semibold">
                  {RELATIONSHIP_FAMILY_LABEL[f]} <span className="text-fg-3 font-mono text-xs font-normal">{byFamily.get(f)!.length}</span>
                </h3>
                <div className="space-y-2">
                  {byFamily.get(f)!.map((r) => (
                    <RelationshipCard key={r.id} rel={r} perspectiveId={id} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="negocios" title="Negócios e transações" count={txs.length}>
        {txs.length === 0 ? (
          <EmptyState>Nenhuma transação documentada no corpus.</EmptyState>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {txs.map((t) => (
              <li key={t.id} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-fg-2 font-mono text-xs">{formatPartialDate(t.date, t.date_precision)}</span>
                  <span className="text-fg font-medium">{t.title}</span>
                  <span className="text-fg-3 text-xs">{TRANSACTION_TYPE_LABEL[t.transaction_type]}</span>
                  <EvidenceBadge cls={t.evidence_class} />
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-fg-3 text-xs">
                  <Link href={entityHref(t.from_id)} className="hover:text-fg">
                    {entityName(t.from_id)}
                  </Link>{" "}
                  →{" "}
                  <Link href={entityHref(t.to_id)} className="hover:text-fg">
                    {entityName(t.to_id)}
                  </Link>{" "}
                  · {formatCurrency(t.amount, t.currency, t.amount_text)}
                </p>
                <p className="text-fg-2 mt-1">{t.description}</p>
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
                  {d.date ? ` · ${formatPartialDate(d.date, d.date_precision)}` : ""}
                  {d.is_official ? " · oficial" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="evidencias" title="Evidências" count={evs.length} description="Cada evidência sustenta uma proposição concreta, com classificação própria.">
        {evs.length === 0 ? (
          <EmptyState>Nenhuma evidência ligada.</EmptyState>
        ) : (
          <Dobra
            rotulo="evidências"
            className="space-y-2 text-sm"
            itens={evs.map((e) => (
              <li key={e.id} className="border-border rounded border px-3 py-2">
                <div className="flex flex-wrap items-start gap-2">
                  <EvidenceBadge cls={e.classification} />
                  <p className="text-fg-2 flex-1">{e.proposition}</p>
                </div>
                {e.excerpt && <blockquote className="text-fg-3 border-border mt-1 border-l pl-3 text-xs italic">{e.excerpt}</blockquote>}
                {(e.attributed_to || e.attributed_to_id) && (
                  <p className="text-fg-3 mt-1 text-xs">Atribuída a: {e.attributed_to_id ? entityName(e.attributed_to_id) : e.attributed_to}</p>
                )}
                {e.inference_basis && <p className="text-fg-3 mt-1 text-xs">Base da inferência: {e.inference_basis}</p>}
                <p className="text-fg-3 mt-1 text-xs">
                  {e.document_ids.map((d) => (
                    <Link key={d} href={`/documentos/${d}`} className="hover:text-fg mr-2 underline-offset-2 hover:underline">
                      documento
                    </Link>
                  ))}
                  {e.source_ids.map((s) => (
                    <Link key={s} href={`/fontes/${s}`} className="hover:text-fg mr-2 underline-offset-2 hover:underline">
                      fonte
                    </Link>
                  ))}
                </p>
              </li>
            ))}
          />
        )}
        {claims.length > 0 && (
          <div className="mt-4">
            <h3 className="text-fg mb-2 text-sm font-semibold">Hipóteses e alegações sob análise</h3>
            <ul className="space-y-2 text-sm">
              {claims.map((c) => (
                <li key={c.id} className="border-border rounded border px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <EvidenceBadge cls={c.classification} />
                    <StatusBadge status={c.status} />
                    {c.claimant && <span className="text-fg-3 text-xs">segundo {c.claimant}</span>}
                  </div>
                  <p className="text-fg-2 mt-1">{c.statement}</p>
                  {c.limits && <p className="text-fg-3 mt-1 text-xs">O que os documentos não permitem afirmar: {c.limits}</p>}
                  {c.adversarial_review && (
                    <p className="text-fg-3 mt-1 text-xs">
                      Revisão adversarial ({formatPartialDate(c.adversarial_review.reviewed_at)}): {c.adversarial_review.attempted_refutation} Resultado: {c.adversarial_review.outcome}.
                    </p>
                  )}
                  <div className="mt-2">
                    <CitedPositionBlock positions={c.counter_position} title="Contraposição" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section id="fontes" title="Fontes" count={sources.length} description={`${official} fonte(s) primária(s) oficial(is).`}>
        <SourceList sources={sources} />
      </Section>

      <Section id="historico" title="Histórico de atualização">
        <dl className="text-fg-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
          <div>
            <dt>Criado</dt>
            <dd className="text-fg-2">{formatPartialDate(entity.created_at)}</dd>
          </div>
          <div>
            <dt>Atualizado</dt>
            <dd className="text-fg-2">{formatPartialDate(entity.updated_at)}</dd>
          </div>
          <div>
            <dt>Revisão</dt>
            <dd className="text-fg-2">{entity.review_status}</dd>
          </div>
          <div>
            <dt>Revisor</dt>
            <dd className="text-fg-2">{entity.reviewer ?? "não informado"}</dd>
          </div>
        </dl>
        <p className="text-fg-3 mt-2 text-xs">
          O histórico completo de alterações deste registro está no Git do repositório e no{" "}
          <Link href="/atualizacoes" className="hover:text-fg underline underline-offset-2">
            registro de atualizações
          </Link>
          . Correções podem ser propostas por issue ou pull request.
        </p>
      </Section>
        </div>
      </div>
    </article>
  );
}
