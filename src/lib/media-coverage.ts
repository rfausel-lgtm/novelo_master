/*
 * Cobertura de imprensa sobre o Novelo Master — não confundir com as fontes do acervo
 * (`data/sources/`), que sustentam fatos do caso. Aqui entra só matéria que fala do projeto.
 * Por isso o registro mora no código do site, e não em `data/`: não é dado investigativo,
 * não entra no grafo e não passa pelas regras de evidência.
 *
 * Ordem: a do array, curada à mão — não é automática por data. A matéria da Oeste abre a lista
 * porque é a única que fala do projeto em texto corrido; as demais creditam como fonte. Com a lista
 * crescendo, trocar por ordenação por `date`.
 *
 * O logo de cada veículo tem duas versões porque a marca original é legível num tema e some no
 * outro (ver `.logo-veiculo-*` em globals.css).
 */
export type MediaCoverage = {
  /** Nome do veículo, como ele se escreve. */
  outlet: string;
  title: string;
  url: string;
  /** ISO 8601. Data de publicação declarada pelo veículo. */
  date: string;
  author?: string;
  section?: string;
  /** Trecho em que a matéria cita o projeto, transcrito literalmente. */
  quote?: string;
  /**
   * Como o veículo citou o projeto, quando não há frase transcrevível — caso típico do crédito de
   * fonte, em que o nome do site aparece só como link. É descrição nossa, não transcrição: por isso
   * entra sem aspas e com marca visual diferente da do `quote`.
   */
  mention?: string;
  logo: { light: string; dark: string; width: number; height: number; alt: string };
};

export const MEDIA_COVERAGE: MediaCoverage[] = [
  {
    outlet: "Revista Oeste",
    title: "As conexões de Daniel Vorcaro",
    url: "https://revistaoeste.com/politica/as-conexoes-de-daniel-vorcaro/",
    date: "2026-09-18",
    author: "Uiliam Grizafis",
    section: "Política",
    quote:
      "O novelo produzido pelo advogado Rafael Fausel mostra com detalhes como o ex-banqueiro construiu suas relações.",
    logo: {
      light: "/midia/revista-oeste.png",
      dark: "/midia/revista-oeste-escuro.png",
      width: 379,
      height: 134,
      alt: "Revista Oeste",
    },
  },
  {
    outlet: "Jornal do Estado MS",
    title: "Banco Master tenta derrubar retenção de R$ 1,42 milhão do IMPCG na Justiça",
    url: "https://jornaldoestadoms.com.br/noticia/53118-banco-master-tenta-derrubar-retencao-de-r-1-42-milhao-do-impcg-na-justica",
    date: "2026-10-01",
    author: "Da Redação",
    section: "Justiça",
    mention: "Cita o Novelo Master como fonte, com link para a ficha do IMPCG.",
    logo: {
      light: "/midia/jornal-do-estado-ms.png",
      dark: "/midia/jornal-do-estado-ms-escuro.png",
      width: 1000,
      height: 214,
      alt: "Jornal do Estado MS",
    },
  },
];
