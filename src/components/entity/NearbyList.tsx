import Link from "next/link";
import type { Nearby, Window } from "@/lib/pages";
import { formatPartialDate } from "@/lib/format";
import { EvidenceBadge } from "./badges";

const WINDOWS: Window[] = [7, 30, 90];

function Group({ title, items, side }: { title: string; items: Nearby["before"]; side: "antes" | "depois" }) {
  return (
    <div>
      <h3 className="text-fg mb-2 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-fg-3 text-xs italic">Nada registrado no corpus nesta janela.</p>
      ) : (
        <div className="space-y-3">
          {WINDOWS.map((w) => {
            const list = items.filter((i) => i.window === w);
            if (list.length === 0) return null;
            return (
              <div key={w}>
                <p className="text-fg-3 mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  até {w} dias {side}
                </p>
                <ul className="space-y-1 text-sm">
                  {list.map(({ item, delta }) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-2">
                      <span className="text-fg-3 font-mono text-xs tabular-nums">
                        {Math.abs(delta)} d · {formatPartialDate(item.date, item.datePrecision)}
                      </span>
                      <Link href={item.href} className="text-fg hover:text-accent underline-offset-2 hover:underline">
                        {item.title}
                      </Link>
                      <span className="text-fg-3 text-xs">{item.kindLabel}</span>
                      <EvidenceBadge cls={item.evidenceClass} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Antes e depois de um evento ou ato: proximidade temporal, nunca causalidade. */
export function NearbyList({ nearby }: { nearby: Nearby }) {
  return (
    <div className="space-y-5">
      <p className="border-border bg-bg-2/60 text-fg-2 rounded border px-3 py-2 text-xs">
        Proximidade temporal não implica causalidade. Esta seção lista apenas o que o corpus registra perto da data, para que o leitor investigue por conta própria.
      </p>
      {nearby.same.length > 0 && (
        <div>
          <h3 className="text-fg mb-2 text-sm font-semibold">No mesmo dia</h3>
          <ul className="space-y-1 text-sm">
            {nearby.same.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-2">
                <Link href={item.href} className="text-fg hover:text-accent underline-offset-2 hover:underline">
                  {item.title}
                </Link>
                <span className="text-fg-3 text-xs">{item.kindLabel}</span>
                <EvidenceBadge cls={item.evidenceClass} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <Group title="Antes" items={nearby.before} side="antes" />
        <Group title="Depois" items={nearby.after} side="depois" />
      </div>
    </div>
  );
}
