import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { pageMetadata } from "@/lib/pages";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Para a imprensa",
  description:
    "Media kit do Novelo Master: apresentação, imagens, números do acervo, metodologia e contato. PDF gratuito para consulta.",
  path: "/imprensa",
  type: "website",
});

const PDF = "/imprensa/novelo-master-media-kit.pdf";

export default function ImprensaPage() {
  return (
    <PageShell>
      <PageTitle
        eyebrow="Materiais e contato"
        title="Para a imprensa"
        lede="Um ponto de partida para conhecer o Novelo Master e consultar as relações do caso Banco Master, com acesso às fontes."
      />

      <section
        aria-labelledby="media-kit"
        className="border-border bg-bg-2 grid gap-8 rounded-lg border p-5 sm:p-8 md:grid-cols-[1fr_250px] md:items-center"
      >
        <div className="min-w-0">
          <p className="text-fg-3 font-mono text-xs">
            PDF · 4 páginas · edição de 9 de setembro de 2026
          </p>
          <h2 id="media-kit" className="text-fg mt-4 text-2xl font-semibold">
            O caso Master, conexão por conexão.
          </h2>
          <p className="text-fg-2 mt-4 text-sm leading-relaxed sm:text-base">
            Apresentação do projeto, capturas do site, números do acervo, gráfico de composição das
            fontes e orientações de consulta.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={PDF}
              className="bg-accent text-bg inline-flex min-h-12 items-center rounded-md px-5 text-sm font-semibold hover:opacity-90"
            >
              Abrir media kit (PDF)
            </a>
            <a
              href={PDF}
              download="Novelo-Master-Media-Kit.pdf"
              className="border-border-strong text-fg-2 hover:text-fg inline-flex min-h-12 items-center rounded-md border px-5 text-sm"
            >
              Baixar PDF
            </a>
          </div>
          <p className="text-fg-3 mt-4 text-xs leading-relaxed">
            Os números do PDF retratam a edição indicada. O acervo continua recebendo atualizações.
          </p>
        </div>
        <a
          href={PDF}
          aria-label="Abrir o media kit em PDF pela capa"
          className="mx-auto block w-full max-w-[250px] shadow-lg"
        >
          <Image
            src="/imprensa/media-kit-capa.png"
            alt="Capa do media kit: O caso Master, conexão por conexão, com captura da abertura do site."
            width={778}
            height={1100}
            className="h-auto w-full"
          />
        </a>
      </section>

      <section aria-labelledby="consultar" className="border-border mt-10 border-b pb-8">
        <h2 id="consultar" className="text-fg text-xl font-semibold">
          Explore o projeto
        </h2>
        <p className="text-fg-2 mt-3 max-w-3xl text-sm leading-relaxed">
          O Novelo Master é gratuito e open source, com código e dados públicos. Cada relação
          informa sua força de evidência, com alegações e inferências identificadas.
        </p>
        <Link
          href="/grafo"
          className="text-accent mt-4 inline-block py-2 font-medium underline underline-offset-4"
        >
          Explorar o grafo interativo
        </Link>
        <p className="text-fg-3 mt-2 max-w-3xl text-sm leading-relaxed">
          Para explorar o grafo com mais conforto e visualizar as conexões em conjunto, recomendamos
          o acesso pelo computador.
        </p>
        <nav
          aria-label="Consulta para a imprensa"
          className="text-fg-2 mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"
        >
          <Link href="/cronologia" className="py-2 underline underline-offset-4">
            Cronologia
          </Link>
          <Link href="/fontes" className="py-2 underline underline-offset-4">
            Fontes
          </Link>
          <Link href="/metodologia" className="py-2 underline underline-offset-4">
            Metodologia
          </Link>
          <Link href="/atualizacoes" className="py-2 underline underline-offset-4">
            Atualizações
          </Link>
          <a href={SITE.repository} className="py-2 underline underline-offset-4">
            Código e dados
          </a>
        </nav>
      </section>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="video">
          <h2 id="video" className="text-fg text-xl font-semibold">
            Apresentação em vídeo
          </h2>
          <p className="text-fg-2 mt-3 text-sm leading-relaxed">
            Um breve teaser apresenta o projeto.
          </p>
          <a
            href="https://www.instagram.com/reel/Dc9Pq6FzB9G/"
            className="text-accent mt-3 inline-block py-2 text-sm underline underline-offset-4"
          >
            Assistir no Instagram
          </a>
        </section>
        <section aria-labelledby="contato">
          <h2 id="contato" className="text-fg text-xl font-semibold">
            Contato
          </h2>
          <p className="text-fg-2 mt-3 text-sm leading-relaxed">
            Rafael Fausel
            <br />
            Advogado em Blumenau/SC · OAB/SC 20.384
          </p>
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-accent mt-3 inline-block py-2 text-sm break-all underline underline-offset-4"
          >
            {SITE.contactEmail}
          </a>
        </section>
      </div>
      <p className="text-fg-3 border-border mt-8 border-t pt-6 text-xs leading-relaxed">
        Crédito sugerido: Novelo Master — novelo-master.fausel.adv.br. Estar no grafo não implica
        ilicitude. Consulte as fontes e preserve as indicações de alegação e inferência ao
        reproduzir um recorte.
      </p>
    </PageShell>
  );
}
