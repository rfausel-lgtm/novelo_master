import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-border text-fg-3 border-t px-4 py-8 text-xs sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-2">
          <p className="text-fg-2 font-medium">{SITE.name}</p>
          <p>
            Mostre a evidência. Mostre a conexão. Mostre a cronologia. Deixe a conclusão para o
            visitante.
          </p>
          <p>
            Estar neste mapa não implica ilicitude. Toda relação aponta para a fonte que a sustenta e
            para a força da evidência correspondente. Alegações e inferências são sempre marcadas como
            tais.
          </p>
        </div>
        <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
          <Link className="hover:text-fg" href="/metodologia">
            Metodologia
          </Link>
          <Link className="hover:text-fg" href="/fontes">
            Fontes
          </Link>
          <Link className="hover:text-fg" href="/atualizacoes">
            Atualizações
          </Link>
          <Link className="hover:text-fg" href="/rede">
            Rede em tabela
          </Link>
          <Link className="hover:text-fg" href="/organizacoes">
            Organizações
          </Link>
          <Link className="hover:text-fg" href="/documentos">
            Documentos
          </Link>
          <Link className="hover:text-fg" href="/eventos">
            Eventos
          </Link>
          <Link className="hover:text-fg" href="/atos">
            Atos públicos
          </Link>
          <a className="hover:text-fg" href={SITE.repository} rel="noopener noreferrer">
            Código e dados (GitHub)
          </a>
        </nav>
      </div>
    </footer>
  );
}
