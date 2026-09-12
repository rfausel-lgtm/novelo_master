import Link from "next/link";
import { SITE } from "@/lib/site";

/**
 * Endereço provisório do jogo, enquanto `jogo.novelo-master.fausel.adv.br` não tem DNS e
 * certificado confirmados. Trocar para o subdomínio só depois de validar os três: resolução,
 * HTTPS válido e acesso sem login.
 */
const URL_DO_JOGO = "https://street-fight-stf.rfausel.chatgpt.site";

/**
 * Ícone em pixel art: um manche de arcade, desenhado em blocos e não recortado de nenhum asset do
 * jogo — o convite não carrega nada de lá além do link. `currentColor` acompanha o texto ao redor,
 * então segue os dois temas sem regra própria.
 */
function IconeArcade({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" shapeRendering="crispEdges">
      <rect x="7" y="0" width="2" height="1" fill="currentColor" />
      <rect x="6" y="1" width="4" height="3" fill="currentColor" />
      <rect x="7" y="4" width="2" height="5" fill="currentColor" />
      <rect x="4" y="9" width="8" height="1" fill="currentColor" />
      <rect x="3" y="10" width="10" height="3" fill="currentColor" />
      <rect x="4" y="13" width="8" height="1" fill="currentColor" />
    </svg>
  );
}

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
          link para o repositório do jogo, sem iframe, sem carregar nenhum asset de lá. Sem som
          automático nem animação contínua — só a transição de cor no hover do botão.
        */}
        <div className="border-border flex flex-col items-start gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <IconeArcade className="text-fg-3 mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="text-fg-3 font-mono text-[10px] tracking-wide uppercase">
                Jogo satírico
              </p>
              <p className="text-fg text-sm font-medium">O plenário pediu intervalo.</p>
              <p className="text-fg-3">A tensão continua. Mas aqui cabe revanche.</p>
            </div>
          </div>
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
    </footer>
  );
}
