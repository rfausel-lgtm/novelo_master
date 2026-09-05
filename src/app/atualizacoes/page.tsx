import type { Metadata } from "next";
import Link from "next/link";
import { allRevisions, corpus, entityHref, entityName } from "@/lib/data";
import { pageMetadata } from "@/lib/pages";
import { formatDateTimeBRT, formatPartialDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { EmptyState } from "@/components/entity/Section";

export const metadata: Metadata = pageMetadata({
  title: "Atualizações",
  description:
    "Histórico de atualizações editoriais do corpus: registros adicionados, relações atualizadas e correções.",
  path: "/atualizacoes",
});

const LABEL: Record<string, string> = {
  people: "pessoas",
  organizations: "organizações",
  events: "eventos",
  documents: "documentos",
  relationships: "relações",
  sources: "fontes",
  evidence: "evidências",
};

export default function AtualizacoesPage() {
  const revisions = allRevisions();
  return (
    <PageShell>
      <PageTitle
        eyebrow="Transparência"
        title="Atualizações"
        lede={`Último build do corpus: ${formatDateTimeBRT(corpus.built_at)}. Cada alteração de dado passa por validação automática e revisão; o histórico completo está no Git do repositório.`}
      />
      {revisions.length === 0 ? (
        <EmptyState>Nenhuma atualização registrada.</EmptyState>
      ) : (
        <ol className="border-border relative ml-2 border-l pl-6">
          {revisions.map((r) => {
            const added = Object.entries(r.added).filter(([, v]) => v > 0);
            return (
              <li key={r.id} id={r.id} className="relative scroll-mt-20 pb-8 last:pb-0">
                <span
                  aria-hidden="true"
                  className="bg-accent absolute top-1.5 -left-[1.85rem] h-2.5 w-2.5 rounded-full"
                />
                <time dateTime={r.date} className="text-fg font-mono text-sm font-medium">
                  {formatPartialDate(r.date)}
                </time>
                {r.title && <p className="text-fg mt-1 text-sm font-medium">{r.title}</p>}
                <p className="text-fg-2 mt-1 text-sm">{r.summary}</p>
                <ul className="text-fg-3 mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
                  {added.map(([k, v]) => (
                    <li key={k}>
                      + {v} {LABEL[k] ?? k}
                    </li>
                  ))}
                  {r.updated_relationships > 0 && (
                    <li>{r.updated_relationships} relações atualizadas</li>
                  )}
                  {r.corrections.length > 0 && <li>{r.corrections.length} correções editoriais</li>}
                </ul>
                {r.corrections.length > 0 && (
                  <ul className="text-fg-2 mt-2 list-disc space-y-1 pl-5 text-xs">
                    {r.corrections.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
                {r.affected_ids.length > 0 && (
                  <p className="text-fg-3 mt-2 text-xs">
                    Registros afetados:{" "}
                    {r.affected_ids.map((id, i) => (
                      <span key={id}>
                        {i > 0 && ", "}
                        <Link
                          href={entityHref(id)}
                          className="hover:text-fg underline-offset-2 hover:underline"
                        >
                          {entityName(id)}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
                {r.author && <p className="text-fg-3 mt-1 text-xs">por {r.author}</p>}
              </li>
            );
          })}
        </ol>
      )}
      <p className="text-fg-3 mt-10 text-xs">
        Trilha de auditoria completa:{" "}
        <a
          href={`${SITE.repository}/commits/main/data`}
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          histórico de commits em /data
        </a>
        .
      </p>
    </PageShell>
  );
}
