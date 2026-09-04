/** Configuração pública do site. Nada aqui é segredo. */
export const SITE = {
  name: "O Novelo Master",
  tagline: "Mapa público de relações, fatos e fontes.",
  description:
    "Mapa público e rastreável das relações, eventos, documentos e fontes relacionados ao caso Banco Master. Mostra a evidência, a conexão e a cronologia; deixa a conclusão para o visitante.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://novelo-master.fausel.adv.br",
  repository: "https://github.com/rfausel-lgtm/novelo_master",
  author: "Rafael Fausel",
  /*
   * Provisório: caso-master@fausel.adv.br tem regra no Cloudflare Email Routing, mas o serviço está
   * desabilitado e o MX do domínio entrega no Google Workspace, então aquele endereço ainda
   * devolve erro. Trocar de volta quando o alias existir de fato.
   */
  contactEmail: "rafael@fausel.adv.br",
  locale: "pt-BR",
  timezone: "America/Sao_Paulo",
} as const;
