/*
 * Cobertura de imprensa sobre o Novelo Master — não confundir com as fontes do acervo
 * (`data/sources/`), que sustentam fatos do caso. Aqui entra só matéria que fala do projeto.
 * Por isso o registro mora no código do site, e não em `data/`: não é dado investigativo,
 * não entra no grafo e não passa pelas regras de evidência.
 *
 * Ordem: mais recente primeiro. O logo de cada veículo tem duas versões porque a marca
 * original é legível no tema claro e some no escuro (ver `.logo-veiculo-*` em globals.css).
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
];
