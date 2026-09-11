import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/pages";
import { PaginaDeAtualizacoes } from "@/components/atualizacoes/PaginaDeAtualizacoes";
import { totalDePaginas } from "@/lib/atualizacoes";
import { allRevisions } from "@/lib/data";

export const dynamicParams = false;

/**
 * A página 1 fica em `/atualizacoes`, e não em `/atualizacoes/pagina/1`: duas rotas servindo a mesma
 * lista seriam URLs duplicadas para o buscador, que é o defeito que a canônica da home e do grafo já
 * teve de corrigir uma vez.
 */
export function generateStaticParams() {
  const total = totalDePaginas(allRevisions().length);
  return Array.from({ length: Math.max(0, total - 1) }, (_, i) => ({ n: String(i + 2) }));
}

function numeroValido(n: string): number | null {
  if (!/^\d+$/.test(n)) return null;
  const p = Number(n);
  return p >= 2 && p <= totalDePaginas(allRevisions().length) ? p : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const pagina = numeroValido(n);
  if (!pagina) return {};
  return pageMetadata({
    title: `Atualizações — página ${pagina}`,
    description: `Histórico de atualizações editoriais do corpus, página ${pagina} de ${totalDePaginas(allRevisions().length)}.`,
    path: `/atualizacoes/pagina/${pagina}`,
  });
}

export default async function AtualizacoesPaginadasPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const pagina = numeroValido(n);
  if (!pagina) notFound();
  return <PaginaDeAtualizacoes pagina={pagina} />;
}
