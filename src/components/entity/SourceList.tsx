import Link from "next/link";
import type { Source } from "@/lib/schema";
import { formatPartialDate } from "@/lib/format";
import { OfficialBadge } from "./badges";
import { Dobra } from "./Dobra";
import { EmptyState } from "./Section";

export function SourceLink({ source }: { source: Source }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <Link href={`/fontes/${source.id}`} className="text-fg hover:text-accent underline-offset-2 hover:underline">
        {source.title}
      </Link>
      <span className="text-fg-3 text-xs">
        {source.publisher}
        {source.publication_date ? ` · ${formatPartialDate(source.publication_date)}` : ""}
      </span>
      <OfficialBadge source={source} />
      <a href={source.url} rel="noopener noreferrer" target="_blank" className="text-fg-3 hover:text-accent text-xs underline-offset-2 hover:underline" aria-label={`Abrir a fonte original: ${source.title}`}>
        original ↗
      </a>
    </span>
  );
}

export function SourceList({ sources, emptyText = "Nenhuma fonte registrada." }: { sources: Source[]; emptyText?: string }) {
  if (sources.length === 0) return <EmptyState>{emptyText}</EmptyState>;
  return (
    <Dobra
      rotulo="fontes"
      className="divide-border divide-y text-sm"
      itens={sources.map((s) => (
        <li key={s.id} className="py-2">
          <SourceLink source={s} />
        </li>
      ))}
    />
  );
}
