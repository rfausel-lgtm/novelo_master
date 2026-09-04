/** Configuração pública do site. Nada aqui é segredo. */
export const SITE = {
  name: "O Novelo Master",
  tagline: "Mapa público de relações, fatos e fontes.",
  description:
    "Mapa público e rastreável das relações, eventos, documentos e fontes relacionados ao caso Banco Master. Mostra a evidência, a conexão e a cronologia; deixa a conclusão para o visitante.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://novelo-master.fausel.adv.br",
  repository: "https://github.com/rfausel-lgtm/novelo_master",
  author: "Rafael Fausel",
  /* Endereço do caso, encaminhado para a caixa pessoal do autor. */
  contactEmail: "caso-master@fausel.adv.br",
  locale: "pt-BR",
  timezone: "America/Sao_Paulo",
} as const;
