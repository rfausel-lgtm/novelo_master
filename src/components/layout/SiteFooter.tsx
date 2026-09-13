import Link from "next/link";
import { SITE } from "@/lib/site";

/**
 * Endereço provisório do jogo, enquanto `jogo.novelo-master.fausel.adv.br` não tem DNS e
 * certificado confirmados. Trocar para o subdomínio só depois de validar os três: resolução,
 * HTTPS válido e acesso sem login.
 */
const URL_DO_JOGO = "https://street-fight-stf.rfausel.chatgpt.site";

export function SiteFooter() {
  return (
    <footer className="border-border text-fg-3 border-t px-4 py-8 text-xs sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md space-y-2">
            <p className="text-fg-2 font-medium">{SITE.name}</p>
            <p>
              Mostre a evidência. Mostre a conexão. Mostre a cronologia. Deixe a conclusão para o
              visitante.
            </p>
            <p>
              Estar neste mapa não implica ilicitude. Toda relação aponta para a fonte que a
              sustenta e para a força da evidência correspondente. Alegações e inferências são
              sempre marcadas como tais.
            </p>
          </div>
          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
            <Link className="hover:text-fg" href="/imprensa">
              Para a imprensa
            </Link>
            <Link className="hover:text-fg" href="/metodologia">
              Metodologia
            </Link>
            <Link className="hover:text-fg" href="/politica-editorial">
              Política editorial
            </Link>
            <Link className="hover:text-fg" href="/perguntar">
              Sua IA responde
            </Link>
            <Link className="hover:text-fg" href="/sobre">
              Sobre e contato
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

        {/*
          Convite ao jogo satírico, à parte do resto do rodapé: separado por régua própria, sem
          link para o repositório do jogo, sem iframe. O banner é a única imagem carregada aqui —
          arte própria do jogo, convertida para WebP e servida por este site, não embutida a partir
          de lá. Sem som automático nem animação contínua: só a transição de cor no hover.

          O título "O plenário pediu intervalo" já está no pixel art do banner; repeti-lo em texto
          seria redundante, então o texto ao lado só complementa.
        */}
        <div className="border-border border-t pt-6">
          <p className="text-fg-3 mb-3 font-mono text-[10px] tracking-wide uppercase">
            Jogo satírico
          </p>
          <a
            href={URL_DO_JOGO}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:border-accent block overflow-hidden rounded-md border transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/jogo-satirico/street-fight-stf-banner.webp"
              alt={
                'Banner do jogo satírico "O Plenário pediu intervalo — STF Edition": dois lutadores ' +
                "em pixel art se enfrentam diante do STF, sob a lua cheia."
              }
              width={1280}
              height={427}
              loading="lazy"
              className="block h-auto w-full"
            />
          </a>
          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-fg-3">A tensão continua. Mas aqui cabe revanche.</p>
            <a
              href={URL_DO_JOGO}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:border-accent hover:text-accent inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs font-medium whitespace-nowrap transition-colors"
            >
              <span aria-hidden="true">▶</span> Entrar na arena
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
