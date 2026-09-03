import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pages";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { MarkdownPage } from "@/components/entity/MarkdownPage";

export const metadata: Metadata = pageMetadata({
  title: "Política editorial",
  description: "O gauntlet editorial, o vocabulário permitido, o contraditório obrigatório, dados pessoais, fotos, correções e direito de resposta.",
  path: "/politica-editorial",
});

export default function PoliticaEditorialPage() {
  return (
    <PageShell>
      <PageTitle eyebrow="Regras da redação" title="Política editorial" />
      <MarkdownPage file="EDITORIAL_POLICY.md" />
    </PageShell>
  );
}
