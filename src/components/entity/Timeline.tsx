import Link from "next/link";
import type { TimelineItem } from "@/lib/pages";
import { formatPartialDate } from "@/lib/format";
import { EvidenceBadge } from "./badges";
import { EmptyState } from "./Section";

export function Timeline({ items, emptyText = "Nenhum evento datado no corpus." }: { items: TimelineItem[]; emptyText?: string }) {
  if (items.length === 0) return <EmptyState>{emptyText}</EmptyState>;
  return (
    <ol className="border-border relative ml-2 border-l pl-5">
      {items.map((it) => (
        <li key={it.id} className="relative pb-5 last:pb-0">
          <span aria-hidden="true" className="bg-fg-3 absolute top-1.5 -left-[1.6rem] h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: "var(--bg)" }} />
          <div className="text-fg-3 flex flex-wrap items-center gap-2 text-xs">
            <time dateTime={it.date} className="text-fg-2 font-mono">
              {formatPartialDate(it.date, it.datePrecision)}
            </time>
            <span>· {it.kindLabel}</span>
            <span>· {it.typeLabel}</span>
            <EvidenceBadge cls={it.evidenceClass} />
          </div>
          <Link href={it.href} className="text-fg hover:text-accent mt-0.5 block font-medium underline-offset-2 hover:underline">
            {it.title}
          </Link>
          {it.agents.length > 0 && (
            <p className="text-fg-3 mt-0.5 text-xs">
              {it.agents.slice(0, 6).map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ", "}
                  <Link href={a.href} className="hover:text-fg">
                    {a.name}
                  </Link>
                </span>
              ))}
              {it.agents.length > 6 && ` e mais ${it.agents.length - 6}`}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
