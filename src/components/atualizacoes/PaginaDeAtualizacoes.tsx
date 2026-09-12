import Link from "next/link";
import { allRevisions, corpus, entityHref, entityName } from "@/lib/data";
import { formatDateTimeBRT, formatPartialDate } from "@/lib/format";
import { SITE } from "@/lib/site";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { EmptyState } from "@/components/entity/Section";
import { artesPorRevisao } from "@/lib/social";
import { PularParaPagina } from "@/components/atualizacoes/PularParaPagina";
import {
  POR_PAGINA,
  hrefDaPagina,
  janelaDePaginas,
  rotuloDoIntervalo,
  totalDePaginas,
} from "@/lib/atualizacoes";

const LABEL: Record<string, string> = {
  people: "pessoas",
  organizations: "organizações",
  events: "eventos",
  documents: "documentos",
  relationships: "relações",
  sources: "fontes",
  evidence: "evidências",
};

/**
 * Seta da barra de paginação. Na primeira e na última página ela vira um `<span>` opaco em vez de
 * sumir: some, e a barra inteira desloca; fica, e o leitor vê que chegou ao fim.
 */
function Seta({
  para,
  rel,
  rotulo,
  simbolo,
}: {
  para: string | null;
  rel: "prev" | "next";
  rotulo: string;
  simbolo: string;
}) {
  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-2 text-base";
  if (!para) {
    return (
      <span aria-hidden="true" className={`${base} border-border text-fg-3 opacity-40`}>
        {simbolo}
      </span>
    );
  }
  return (
    <Link
      href={para}
      rel={rel}
      aria-label={rotulo}
      className={`${base} border-border text-fg-2 hover:border-fg-3 hover:text-fg focus-visible:outline-accent transition-colors`}
    >
      <span aria-hidden="true">{simbolo}</span>
    </Link>
  );
}

export function PaginaDeAtualizacoes({ pagina }: { pagina: number }) {
  const todas = allRevisions();
  const paginas = totalDePaginas(todas.length);
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
                {/*
                  No celular a arte abre o item, em largura cheia, e o texto vem embaixo: a coluna
                  é estreita e a imagem paisagem ocupa pouca altura.

                  A partir de `md` ela sai do topo e vai para a direita, dividindo o item em duas
                  colunas iguais com o texto. Em largura cheia, na coluna de ~944 px, a mesma imagem
                  paisagem virava um bloco de mais de 500 px de altura por lote e empurrava o texto
                  — que é o conteúdo — para fora da tela a cada item.

                  `md:pr-[33px]` espelha a margem da esquerda: o texto começa 33 px dentro da caixa da
                  página (`ml-2` + 1 px de borda + `pl-6` da linha do tempo), então a imagem termina 33 px antes da
                  borda direita. Sem isso a imagem encostava na borda e o item ficava torto.

                  A legenda continua colada na imagem, e não no texto: é da imagem que ela fala.
                */}
                <div
                  className={
                    arte ? "md:grid md:grid-cols-2 md:items-start md:gap-6 md:pr-[33px]" : undefined
                  }
                >
                  {arte && (
                    <figure className="mb-3 md:order-last md:mb-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={arte.src}
                        alt={
                          arte.tipo === "card"
                            ? `Cartão de divulgação do lote${r.title ? `: ${r.title}` : ""}`
                            : `Arte de divulgação gerada por inteligência artificial${r.title ? `: ${r.title}` : ""}`
                        }
                        width={arte.width}
                        height={arte.height}
                        loading="lazy"
                        className="border-border w-full rounded-md border"
                      />
                      {/*
                        A legenda muda com o tipo porque as duas artes não têm a mesma procedência.
                        "Gerada por IA" é verdade sobre a cena que o Codex pinta e mentira sobre um
                        cartão, que só compõe o título já aprovado pelo acervo sobre um emaranhado
                        desenhado a partir do id da revisão. Num site cujo assunto é procedência,
                        legenda imprecisa custa mais do que ausência de legenda.
                      */}
                      <figcaption className="text-fg-3 mt-1 text-[10px] tracking-wide uppercase">
                        {arte.tipo === "card"
                          ? "Cartão gerado do próprio acervo"
                          : "Ilustração gerada por IA"}
                      </figcaption>
                    </figure>
                  )}
                  <div className={arte ? "md:min-w-0" : undefined}>
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
                      {r.corrections.length > 0 && (
                        <li>{r.corrections.length} correções editoriais</li>
                      )}
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
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/*
        Paginação numerada, que é a forma convencional de navegar conteúdo — o leitor já sabe operar
        sem instrução. As setas sozinhas não serviam: com 21 páginas, chegar ao começo do acervo
        exigiria vinte cliques.

        As setas das pontas ficam desabilitadas em vez de sumirem, para a barra não mudar de largura
        nem de posição de uma página para outra. Tudo centrado com `justify-center` e com quebra de
        linha permitida, então nada depende de sobrar espaço — foi a dependência de sobra que
        descentrou o rótulo no celular na versão anterior.
      */}
      {paginas > 1 && (
        <nav aria-label="Paginação das atualizações" className="border-border mt-8 border-t pt-4">
          <p className="text-fg-3 text-center font-mono text-xs">
            {rotuloDoIntervalo(
              revisions.map((r) => r.id),
              primeiro,
              todas.length,
            )}
          </p>

          <ol className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-sm">
            <li>
              <Seta
                para={pagina > 1 ? hrefDaPagina(pagina - 1) : null}
                rel="prev"
                rotulo="Página anterior"
                simbolo="‹"
              />
            </li>

            {janelaDePaginas(pagina, paginas).map((p, i) =>
              p === null ? (
                <li key={`lacuna-${i}`} aria-hidden="true" className="text-fg-3 px-1 select-none">
                  …
                </li>
              ) : (
                <li
                  key={p}
                  /*
                   * No celular a barra inteira não cabe: nove itens a 40 px quebravam em três
                   * linhas a 375 px (medido). As vizinhas da atual saem abaixo de 640 px — quem
                   * quer a página de trás ou da frente usa as setas, que fazem exatamente isso.
                   * Primeira, última e atual ficam sempre, porque nenhuma seta substitui o salto
                   * para o começo ou o fim do acervo.
                   */
                  className={
                    p !== 1 && p !== paginas && p !== pagina ? "hidden sm:block" : undefined
                  }
                >
                  {p === pagina ? (
                    <span
                      aria-current="page"
                      className="bg-accent text-bg inline-flex h-10 min-w-10 items-center justify-center rounded-md px-2 font-medium tabular-nums"
                    >
                      {p}
                    </span>
                  ) : (
                    <Link
                      href={hrefDaPagina(p)}
                      aria-label={`Página ${p}`}
                      className="border-border text-fg-2 hover:border-fg-3 hover:text-fg focus-visible:outline-accent inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-2 tabular-nums transition-colors"
                    >
                      {p}
                    </Link>
                  )}
                </li>
              ),
            )}

            <li>
              <Seta
                para={pagina < paginas ? hrefDaPagina(pagina + 1) : null}
                rel="next"
                rotulo="Próxima página"
                simbolo="›"
              />
            </li>
          </ol>

          <PularParaPagina atual={pagina} total={paginas} />
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
