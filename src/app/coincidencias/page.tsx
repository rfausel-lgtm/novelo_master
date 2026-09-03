import type { Metadata } from "next";
import Link from "next/link";
import { allSequences, getEvent, getPublicAct } from "@/lib/data";
import { pageMetadata, sourcesByIds } from "@/lib/pages";
import { daysBetween, formatPartialDate } from "@/lib/format";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { EmptyState } from "@/components/entity/Section";
import { EvidenceBadge } from "@/components/entity/badges";
import { SourceList } from "@/components/entity/SourceList";

export const metadata: Metadata = pageMetadata({
  title: "Coincidências temporais",
  description: "Sequências de eventos e atos públicos próximos no tempo, com proximidade, nexo documental e causalidade classificados separadamente.",
  path: "/coincidencias",
});

const PROX: Record<string, string> = { high: "alta", medium: "média", low: "baixa" };
const LINK: Record<string, string> = { present: "existente", absent: "ausente", partial: "parcial" };

export default function CoincidenciasPage() {
  const seqs = allSequences();
  return (
    <PageShell>
      <PageTitle eyebrow="Análise" title="Coincidências temporais" lede="Sequências em que eventos e atos públicos ocorrem próximos no tempo. Cada sequência separa três coisas que não se confundem: proximidade temporal, nexo documental e causalidade comprovada." />
      {seqs.length === 0 ? (
        <EmptyState>Nenhuma sequência temporal publicada ainda. Sequências entram no corpus após o gauntlet editorial, sempre com os limites do que se conclui.</EmptyState>
      ) : (
        <div className="space-y-10">
          {seqs.map((s) => {
            const steps = s.step_ids.map((id) => {
              const e = getEvent(id);
              if (e) return { id, title: e.title, date: e.date, href: `/eventos/${id}`, cls: e.evidence_class, kind: "Evento" };
              const a = getPublicAct(id);
              if (a) return { id, title: a.title, date: a.date, href: `/atos/${id}`, cls: a.evidence_class, kind: "Ato público" };
              return null;
            });
            return (
              <article key={s.id} className="border-border rounded-md border p-5">
                <h2 className="text-fg text-lg font-semibold tracking-tight">{s.title}</h2>
                <ol className="mt-4 space-y-1">
                  {steps.map((st, i) => (
                    <li key={st?.id ?? i}>
                      {i > 0 && st && steps[i - 1] && (
                        <div className="text-fg-3 ml-3 flex items-center gap-2 py-1 text-xs">
                          <span aria-hidden="true">↓</span> intervalo: {daysBetween(steps[i - 1]!.date, st.date)} dias
                        </div>
                      )}
                      {st ? (
                        <div className="border-border bg-bg-2/50 flex flex-wrap items-center gap-2 rounded border px-3 py-2 text-sm">
                          <span className="text-fg-3 font-mono text-xs">{formatPartialDate(st.date)}</span>
                          <span className="text-fg-3 text-xs">{st.kind}</span>
                          <Link href={st.href} className="text-fg hover:text-accent font-medium underline-offset-2 hover:underline">
                            {st.title}
                          </Link>
                          <EvidenceBadge cls={st.cls} />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="border-border rounded border px-3 py-2">
                    <dt className="text-fg-3 text-xs">Proximidade temporal</dt>
                    <dd className="text-fg font-medium">{PROX[s.temporal_proximity]}</dd>
                  </div>
                  <div className="border-border rounded border px-3 py-2">
                    <dt className="text-fg-3 text-xs">Nexo documental</dt>
                    <dd className="text-fg font-medium">{LINK[s.documentary_link]}</dd>
                  </div>
                  <div className="border-border rounded border px-3 py-2">
                    <dt className="text-fg-3 text-xs">Causalidade comprovada</dt>
                    <dd className="text-fg font-medium">{s.causality_proven ? "sim" : "não"}</dd>
                  </div>
                </dl>
                <p className="text-fg-2 mt-4 text-sm leading-relaxed">{s.description}</p>
                <p className="border-accent/50 text-fg-2 mt-3 border-l-2 pl-3 text-sm">
                  <span className="text-fg-3 text-xs uppercase">O que não se conclui: </span>
                  {s.limits}
                </p>
                <div className="mt-4">
                  <h3 className="text-fg-3 mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Fontes</h3>
                  <SourceList sources={sourcesByIds(s.source_ids)} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
