import Link from "next/link";
import { allRevisions, corpus, entityHref, entityName } from "@/lib/data";
import { formatDateTimeBRT, formatPartialDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { EmptyState } from "@/components/entity/Section";
import { artesPorRevisao } from "@/lib/social";
import { POR_PAGINA, hrefDaPagina, rotuloDoIntervalo, totalDePaginas } from "@/lib/atualizacoes";

const LABEL: Record<string, string> = {
  people: "pessoas",
  organizations: "organizações",
  events: "eventos",
  documents: "documentos",
  relationships: "relações",
  sources: "fontes",
  evidence: "evidências",
};

export function PaginaDeAtualizacoes({ pagina }: { pagina: number }) {
  const todas = allRevisions();
  const paginas = totalDePaginas();
  const primeiro = (pagina - 1) * POR_PAGINA;
  const revisions = todas.slice(primeiro, primeiro + POR_PAGINA);
  const artes = artesPorRevisao();

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
            const arte = artes.get(r.id);
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
                {arte && (
                  <figure className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={arte.src}
                      alt={`Arte de divulgação gerada por inteligência artificial${r.title ? `: ${r.title}` : ""}`}
                      width={arte.width}
                      height={arte.height}
                      loading="lazy"
                      className="border-border w-full rounded-md border"
                    />
                    <figcaption className="text-fg-3 mt-1 text-[10px] tracking-wide uppercase">
                      Ilustração gerada por IA
                    </figcaption>
                  </figure>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/*
        Rótulo em cima, numa linha só dele, e as setas embaixo.

        A tentativa anterior punha os três lado a lado numa grade `1fr auto 1fr`, contando com as
        colunas das pontas para centrar o rótulo. Medido em produção, isso só vale em tela larga: a
        375 px não sobra espaço, as duas colunas `1fr` colapsam para zero e o rótulo sai 33 px do
        centro. Com o rótulo na própria linha ele fica centrado em qualquer largura, sem depender de
        sobra — e a linha das setas é uma grade de duas colunas, para a seta única da primeira e da
        última página ficar no seu lado em vez de escorregar para a esquerda.
      */}
      {paginas > 1 && (
        <nav
          aria-label="Paginação das atualizações"
          className="border-border mt-8 border-t pt-4 text-sm"
        >
          <p className="text-fg-3 text-center font-mono text-xs">
            {rotuloDoIntervalo(
              revisions.map((r) => r.id),
              primeiro,
              todas.length,
            )}
            <span className="block">
              página {pagina} de {paginas}
            </span>
          </p>

          <div className="mt-1 grid grid-cols-2 items-center gap-4">
            {/* A lista vai da mais recente para a mais antiga: a seta da esquerda anda para páginas menores. */}
            {pagina > 1 ? (
              <Link
                href={hrefDaPagina(pagina - 1)}
                rel="prev"
                className="text-fg-2 hover:text-fg inline-flex min-h-11 items-center gap-1.5 justify-self-start underline-offset-4 hover:underline"
              >
                <span aria-hidden="true">←</span> Mais recentes
              </Link>
            ) : (
              <span />
            )}

            {pagina < paginas ? (
              <Link
                href={hrefDaPagina(pagina + 1)}
                rel="next"
                className="text-fg-2 hover:text-fg inline-flex min-h-11 items-center gap-1.5 justify-self-end underline-offset-4 hover:underline"
              >
                Mais antigas <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <span />
            )}
          </div>
        </nav>
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
