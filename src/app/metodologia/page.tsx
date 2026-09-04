import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pages";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { MarkdownPage } from "@/components/entity/MarkdownPage";

export const metadata: Metadata = pageMetadata({
  title: "Metodologia",
  description: "Critérios de inclusão, classificação de evidência, fontes aceitas, contraditório, correções, uso de IA e limitações do Novelo Master.",
  path: "/metodologia",
});

export default function MetodologiaPage() {
  return (
    <PageShell>
      <PageTitle eyebrow="Como o Novelo funciona" title="Metodologia" />
      <MarkdownPage file="METHODOLOGY.md" />
    </PageShell>
  );
}
