import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pages";
import { PaginaDeAtualizacoes } from "@/components/atualizacoes/PaginaDeAtualizacoes";

export const metadata: Metadata = pageMetadata({
  title: "Atualizações",
  description:
    "Histórico de atualizações editoriais do corpus: registros adicionados, relações atualizadas e correções.",
  path: "/atualizacoes",
});

export default function AtualizacoesPage() {
  return <PaginaDeAtualizacoes pagina={1} />;
}
