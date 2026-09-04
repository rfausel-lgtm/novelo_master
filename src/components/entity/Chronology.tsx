"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TimelineItem } from "@/lib/pages";
import type { EvidenceClass } from "@/lib/schema";
import { EVIDENCE_CLASS_LABEL } from "@/lib/schema";
import { formatPartialDate } from "@/lib/format";
import { EvidenceBadge } from "./badges";

const CLASSES: EvidenceClass[] = ["D", "C", "A", "I"];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function Chronology({ items }: { items: TimelineItem[] }) {
  const [agent, setAgent] = useState<string>("all");
  const [classes, setClasses] = useState<Set<EvidenceClass>>(new Set(CLASSES));
  const [kind, setKind] = useState<string>("all");

  const agents = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of items) for (const a of it.agents) m.set(a.id, a.name);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [items]);

  const filtered = items.filter(
    (it) => (agent === "all" || it.agents.some((a) => a.id === agent)) && classes.has(it.evidenceClass) && (kind === "all" || it.kind === kind),
  );

  const groups = useMemo(() => {
    const g = new Map<string, TimelineItem[]>();
    for (const it of filtered) {
      const [y, m] = it.date.split("-");
      const key = m ? `${MONTHS[Number(m) - 1]} de ${y}` : y;
      g.set(key, [...(g.get(key) ?? []), it]);
    }
    return [...g.entries()];
  }, [filtered]);

  const toggle = (c: EvidenceClass) => {
    const next = new Set(classes);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setClasses(next);
  };

  return (
    <div>
      <div className="border-border mb-6 flex flex-wrap items-end gap-4 border-y py-3 text-sm">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-fg-3">Agente</span>
          <select value={agent} onChange={(e) => setAgent(e.target.value)} className="border-border-strong bg-bg-2 text-fg h-9 max-w-xs rounded-md border px-2">
            <option value="all">Todos</option>
            {agents.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-fg-3">Tipo</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="border-border-strong bg-bg-2 text-fg h-9 rounded-md border px-2">
            <option value="all">Todos</option>
            <option value="event">Eventos</option>
            <option value="public_act">Atos públicos</option>
            <option value="transaction">Transações</option>
          </select>
        </label>
        <fieldset className="flex items-center gap-3 text-xs">
          <legend className="text-fg-3 mb-1">Força da evidência</legend>
          {CLASSES.map((c) => (
            <label key={c} className="text-fg-2 flex items-center gap-1">
              <input type="checkbox" checked={classes.has(c)} onChange={() => toggle(c)} className="accent-accent" />
              <span className="font-mono">{c}</span> <span className="sr-only">{EVIDENCE_CLASS_LABEL[c]}</span>
            </label>
          ))}
        </fieldset>
        <span className="text-fg-3 ml-auto text-xs tabular-nums" aria-live="polite">
          {filtered.length} de {items.length} registros
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="text-fg-3 text-sm italic">Nenhum registro com esses filtros.</p>
      ) : (
        <div className="space-y-8">
          {groups.map(([label, list]) => (
            <section key={label} aria-labelledby={`g-${label}`}>
              <h2 id={`g-${label}`} className="text-fg-3 sticky top-14 z-10 mb-2 bg-[var(--bg)] py-1 font-mono text-[11px] tracking-[0.2em] uppercase">
                {label}
              </h2>
              {/*
                Abaixo de md a tabela dava 112px fixos à data e deixava ~150px para o título, que
                quebrava em cinco linhas. Cartões empilhados no celular, tabela no desktop; só um
                dos dois é renderizado, então leitores de tela veem uma versão apenas.
              */}
              <ul className="divide-border divide-y md:hidden">
                {list.map((it) => (
                  <li key={it.id} className="py-3">
                    <div className="text-fg-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                      <time dateTime={it.date} className="font-mono">
                        {formatPartialDate(it.date, it.datePrecision)}
                      </time>
                      <span aria-hidden="true">·</span>
                      <span>{it.kindLabel}</span>
                      <EvidenceBadge cls={it.evidenceClass} />
                    </div>
                    <Link href={it.href} className="text-fg hover:text-accent mt-1 block text-[15px] leading-snug font-medium underline-offset-2 hover:underline">
                      {it.title}
                    </Link>
                    <p className="text-fg-3 mt-1 line-clamp-2 text-xs">{it.description}</p>
                    {it.agents.length > 0 && (
                      <p className="text-fg-3 mt-1 text-xs">
                        {it.agents.slice(0, 3).map((a, i) => (
                          <span key={a.id}>
                            {i > 0 && ", "}
                            <Link href={a.href} className="hover:text-fg">
                              {a.name}
                            </Link>
                          </span>
                        ))}
                        {it.agents.length > 3 && ` +${it.agents.length - 3}`}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Registros de {label}</caption>
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Data</th>
                      <th scope="col">Evento</th>
                      <th scope="col">Agentes</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Fonte</th>
                      <th scope="col">Força da evidência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {list.map((it) => (
                      <tr key={it.id} className="align-top">
                        <td className="text-fg-2 w-28 py-2.5 pr-3 font-mono text-xs whitespace-nowrap">
                          <time dateTime={it.date}>{formatPartialDate(it.date, it.datePrecision)}</time>
                        </td>
                        <td className="py-2.5 pr-3">
                          <Link href={it.href} className="text-fg hover:text-accent font-medium underline-offset-2 hover:underline">
                            {it.title}
                          </Link>
                          <p className="text-fg-3 mt-0.5 line-clamp-2 text-xs">{it.description}</p>
                        </td>
                        <td className="text-fg-3 hidden max-w-[16rem] py-2.5 pr-3 text-xs md:table-cell">
                          {it.agents.slice(0, 5).map((a, i) => (
                            <span key={a.id}>
                              {i > 0 && ", "}
                              <Link href={a.href} className="hover:text-fg">
                                {a.name}
                              </Link>
                            </span>
                          ))}
                          {it.agents.length > 5 && ` +${it.agents.length - 5}`}
                        </td>
                        <td className="text-fg-3 hidden py-2.5 pr-3 text-xs whitespace-nowrap lg:table-cell">
                          {it.kindLabel} · {it.typeLabel}
                        </td>
                        <td className="text-fg-3 hidden max-w-[14rem] py-2.5 pr-3 text-xs lg:table-cell">
                          {it.firstSourceTitle ?? "sem fonte direta"}
                          {it.sourceCount > 1 && ` (+${it.sourceCount - 1})`}
                        </td>
                        <td className="py-2.5 whitespace-nowrap">
                          <EvidenceBadge cls={it.evidenceClass} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
