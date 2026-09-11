/**
 * Paginação de /atualizacoes.
 *
 * A página listava as 204 revisões de uma vez e o HTML passou de 1,1 MB — peso que o leitor de
 * celular paga inteiro para ler as últimas. Dez por página é o recorte pedido.
 *
 * A lógica mora aqui, e não no componente, porque o sitemap também precisa saber quantas páginas
 * existem: sitemap importando componente arrastaria React e `node:fs` (via lib/social) para dentro
 * do grafo de módulos de um arquivo que só devia conhecer dados.
 *
 * O módulo é PURO de propósito — nada de `@/lib/data` aqui dentro. Ver `totalDePaginas`.
 */
export const POR_PAGINA = 10;

/**
 * Recebe a contagem em vez de ler o corpus: este módulo é importado por um componente de cliente
 * (o salto para página), e uma importação de `@/lib/data` aqui arrastaria o acervo inteiro para o
 * pacote que vai ao navegador.
 */
export function totalDePaginas(totalDeRevisoes: number): number {
  return Math.max(1, Math.ceil(totalDeRevisoes / POR_PAGINA));
}

/** `/atualizacoes` é a página 1; as demais moram sob `/atualizacoes/pagina/N`. */
export function hrefDaPagina(n: number): string {
  return n <= 1 ? "/atualizacoes" : `/atualizacoes/pagina/${n}`;
}

/**
 * O número do lote sai do id da revisão. Nem toda revisão tem um — houve `seed-inicial`, e existem
 * sufixos como `lote-75b` —, por isso o rótulo cai para a posição no acervo quando não resolve.
 *
 * Exportado para teste: é a regra que decide o que o leitor lê embaixo das setas.
 */
export function loteDo(id: string): string | null {
  const m = /-lote-(\d+[a-z]?)(?:-|$)/.exec(id);
  return m ? m[1] : null;
}

export function rotuloDoIntervalo(ids: string[], primeiro: number, total: number): string {
  const posicoes = `${primeiro + 1}–${primeiro + ids.length} de ${total}`;
  if (ids.length === 0) return posicoes;
  const inicio = loteDo(ids[0]);
  const fim = loteDo(ids[ids.length - 1]);
  if (inicio && fim && inicio !== fim) return `lote ${inicio} até lote ${fim} · ${posicoes}`;
  return `${posicoes} atualizações`;
}

/** Buraco entre blocos de números na barra de paginação. */
export const LACUNA = null;

/**
 * Os números a mostrar na barra: primeira, última, a atual e as vizinhas, com reticências no lugar
 * do que foi omitido — a forma convencional de paginar conteúdo, e a que o leitor já sabe operar.
 *
 * Com 21 páginas, mostrar todas seria uma fileira ilegível no celular; mostrar só setas obriga a
 * clicar dezenove vezes para chegar ao começo do acervo. A janela resolve as duas coisas: de
 * qualquer página dá para ir à primeira, à última, ou caminhar de uma em uma.
 */
export function janelaDePaginas(atual: number, total: number, raio = 1): (number | null)[] {
  if (total <= 1) return [1];
  const mostrar = new Set<number>([1, total]);
  for (let p = atual - raio; p <= atual + raio; p++) {
    if (p >= 1 && p <= total) mostrar.add(p);
  }
  const ordenadas = [...mostrar].sort((a, b) => a - b);
  const saida: (number | null)[] = [];
  ordenadas.forEach((p, i) => {
    // Só há reticências quando o salto esconde algo; pular exatamente uma página mostra o número.
    if (i > 0 && p - ordenadas[i - 1] > 1) saida.push(LACUNA);
    saida.push(p);
  });
  return saida;
}
