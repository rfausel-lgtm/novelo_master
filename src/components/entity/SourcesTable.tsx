"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPartialDate } from "@/lib/format";

export interface SourceRow {
  id: string;
  title: string;
  publisher: string;
  type: string;
  typeLabel: string;
  official: boolean;
  date: string;
  verified: boolean;
  uses: number;
  url: string;
}

export function SourcesTable({ rows }: { rows: SourceRow[] }) {
  const [type, setType] = useState<string>("all");
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [q, setQ] = useState("");
  const types = useMemo(() => [...new Map(rows.map((r) => [r.type, r.typeLabel])).entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")), [rows]);
  const filtered = rows.filter((r) => (type === "all" || r.type === type) && (!onlyOfficial || r.official) && (!q || `${r.title} ${r.publisher}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-fg-3">Buscar</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="título ou veículo" className="border-border-strong bg-bg-2 text-fg placeholder:text-fg-3 h-9 rounded-md border px-2" />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-fg-3">Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="border-border-strong bg-bg-2 text-fg h-9 rounded-md border px-2">
            <option value="all">Todos</option>
            {types.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="text-fg-2 flex h-9 items-center gap-2 text-xs">
          <input type="checkbox" checked={onlyOfficial} onChange={(e) => setOnlyOfficial(e.target.checked)} className="accent-accent" />
          Somente fontes oficiais
        </label>
        <span className="text-fg-3 ml-auto text-xs tabular-nums" aria-live="polite">
          {filtered.length} de {rows.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Fontes do corpus</caption>
          <thead className="text-fg-3 text-xs uppercase">
            <tr className="border-border border-b">
              <th scope="col" className="py-2 pr-3">Data</th>
              <th scope="col" className="py-2 pr-3">Fonte</th>
              <th scope="col" className="py-2 pr-3">Veículo</th>
              <th scope="col" className="py-2 pr-3">Tipo</th>
              <th scope="col" className="py-2 pr-3">Verificada</th>
              <th scope="col" className="py-2">Usos</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="text-fg-3 py-2 pr-3 font-mono text-xs whitespace-nowrap">{r.date ? formatPartialDate(r.date) : "s/d"}</td>
                <td className="py-2 pr-3">
                  <Link href={`/fontes/${r.id}`} className="text-fg hover:text-accent underline-offset-2 hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="text-fg-2 py-2 pr-3 text-xs">{r.publisher}</td>
                <td className="py-2 pr-3 text-xs">
                  <span className={r.official ? "text-rel-financial" : "text-fg-2"}>{r.official ? "Oficial · " : ""}{r.typeLabel}</span>
                </td>
                <td className="text-fg-2 py-2 pr-3 text-xs">{r.verified ? "sim" : "não"}</td>
                <td className="text-fg-2 py-2 text-xs tabular-nums">{r.uses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
