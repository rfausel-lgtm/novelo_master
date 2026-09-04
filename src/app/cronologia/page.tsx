import type { Metadata } from "next";
import { fullTimeline, pageMetadata } from "@/lib/pages";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { SectionBanner } from "@/components/entity/SectionBanner";
import { Chronology } from "@/components/entity/Chronology";

export const metadata: Metadata = pageMetadata({
  title: "Cronologia",
  description:
    "Todos os eventos, atos públicos e transações do corpus em ordem temporal, com agentes, fonte e força da evidência.",
  path: "/cronologia",
});

export default function CronologiaPage() {
  const items = fullTimeline();
  return (
    <PageShell>
      <PageTitle
        eyebrow="Linha do tempo"
        title="Cronologia"
        lede="Eventos, atos públicos e transações em ordem temporal. Filtre por agente, tipo e força da evidência. Proximidade no tempo não implica causalidade."
      />
      <SectionBanner variant="timeline" />
      <Chronology items={items} />
    </PageShell>
  );
}
