import type { Metadata } from "next";
import { allPublicActs } from "@/lib/data";
import { pageMetadata, publicActToTimeline } from "@/lib/pages";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { Timeline } from "@/components/entity/Timeline";

export const metadata: Metadata = pageMetadata({
  title: "Atos públicos",
  description: "Decisões judiciais, atos regulatórios, legislativos e administrativos relacionados ao caso Banco Master, com emissor, agentes e fontes.",
  path: "/atos",
});

export default function AtosPage() {
  return (
    <PageShell>
      <PageTitle eyebrow="Índice" title="Atos públicos" lede="Decisões judiciais, atos do Banco Central, emendas e outros atos de autoridades, com quem os praticou, quem foi afetado e a documentação que os sustenta." />
      <Timeline items={allPublicActs().map(publicActToTimeline)} emptyText="Nenhum ato público publicado ainda." />
    </PageShell>
  );
}
