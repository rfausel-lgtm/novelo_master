import type { Metadata } from "next";
import { allEvents } from "@/lib/data";
import { eventToTimeline, pageMetadata } from "@/lib/pages";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { Timeline } from "@/components/entity/Timeline";

export const metadata: Metadata = pageMetadata({
  title: "Eventos",
  description: "Reuniões, comunicações, atos de investigação, decisões e outros eventos datados do caso Banco Master, com participantes e força da evidência.",
  path: "/eventos",
});

export default function EventosPage() {
  const items = allEvents().map(eventToTimeline);
  return (
    <PageShell>
      <PageTitle eyebrow="Índice" title="Eventos" lede="Todos os eventos datados do corpus, em ordem cronológica. Para a visão consolidada com atos públicos e transações, veja a cronologia." />
      <Timeline items={items} />
    </PageShell>
  );
}
