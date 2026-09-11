import { allRevisions } from "@/lib/data";

/**
 * Paginação de /atualizacoes.
 *
 * A página listava as 204 revisões de uma vez e o HTML passou de 1,1 MB — peso que o leitor de
 * celular paga inteiro para ler as últimas. Dez por página é o recorte pedido.
 *
 * A lógica mora aqui, e não no componente, porque o sitemap também precisa saber quantas páginas
 * existem: sitemap importando componente arrastaria React e `node:fs` (via lib/social) para dentro
 * do grafo de módulos de um arquivo que só devia conhecer dados.
 */
export const POR_PAGINA = 10;

export function totalDePaginas(): number {
  return Math.max(1, Math.ceil(allRevisions().length / POR_PAGINA));
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
