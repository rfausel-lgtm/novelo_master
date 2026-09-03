import Link from "next/link";
import { corpus, stats, lastUpdated } from "@/lib/data";
import { formatDateTimeBRT, formatNumber, formatPartialDate } from "@/lib/format";
import { Logo } from "@/components/ui/Logo";
import { EVIDENCE_CLASS_LABEL, type EvidenceClass } from "@/lib/schema";

const STATS: { key: keyof typeof stats; label: string }[] = [
  { key: "people", label: "pessoas" },
  { key: "organizations", label: "organizações" },
  { key: "events", label: "eventos" },
  { key: "documents", label: "documentos" },
  { key: "evidence", label: "evidências" },
  { key: "official_sources", label: "fontes oficiais" },
];

const CLASSES: { cls: EvidenceClass; color: string }[] = [
  { cls: "D", color: "var(--ev-d)" },
  { cls: "C", color: "var(--ev-c)" },
  { cls: "A", color: "var(--ev-a)" },
  { cls: "I", color: "var(--ev-i)" },
];

function Background() {
  // Rede estática e discreta ao fundo (sem animação).
  const pts = [
    [8, 22], [18, 60], [27, 35], [40, 75], [52, 28], [63, 58], [75, 18], [86, 66], [94, 40], [34, 12], [58, 88], [12, 84],
  ];
  const links: [number, number][] = [[0, 2], [2, 4], [4, 6], [6, 8], [1, 3], [3, 5], [5, 7], [2, 9], [4, 9], [5, 10], [1, 11], [3, 10], [7, 8]];
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]" viewBox="0 0 100 100" preserveAspectRatio="none">
      {links.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="#4C8DFF" strokeWidth="0.15" />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.45" fill="#F4F6F8" />
      ))}
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col">
      <Background />
      <section className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-24">
        <Logo className="h-16 w-16" />
        <h1 className="text-fg mt-6 text-3xl font-semibold tracking-[0.2em] uppercase sm:text-4xl">O Novelo Master</h1>
        <p className="text-fg-2 mt-4 max-w-xl text-lg leading-snug sm:text-2xl">
          Mapa público de relações,
          <br />
          fatos e fontes.
        </p>
        <Link href="/grafo" className="bg-accent text-bg hover:bg-accent/90 focus-visible:outline-accent mt-10 inline-flex h-12 items-center rounded-md px-6 text-sm font-semibold tracking-[0.18em] uppercase">
          Explorar o Novelo
        </Link>

        <dl className="mt-14 grid w-full grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 md:grid-cols-6">
          {STATS.map((s) => (
            <div key={s.key}>
              <dd className="text-fg text-2xl font-semibold tabular-nums sm:text-3xl">{formatNumber(stats[s.key] as number)}</dd>
              <dt className="text-fg-3 mt-1 text-xs tracking-wide uppercase">{s.label}</dt>
            </div>
          ))}
        </dl>

        <p className="text-fg-3 mt-10 font-mono text-xs">
          Última atualização: <span className="text-fg-2">{formatDateTimeBRT(corpus.built_at)}</span> · dados até {formatPartialDate(lastUpdated())}
        </p>

        <nav aria-label="Atalhos" className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          <Link href="/cronologia" className="text-fg-2 hover:text-fg underline-offset-4 hover:underline">
            Cronologia
          </Link>
          <Link href="/coincidencias" className="text-fg-2 hover:text-fg underline-offset-4 hover:underline">
            Coincidências temporais
          </Link>
          <Link href="/pessoas" className="text-fg-2 hover:text-fg underline-offset-4 hover:underline">
            Pessoas
          </Link>
          <Link href="/fontes" className="text-fg-2 hover:text-fg underline-offset-4 hover:underline">
            Fontes
          </Link>
          <Link href="/metodologia" className="text-fg-2 hover:text-fg underline-offset-4 hover:underline">
            Metodologia
          </Link>
          <Link href="/rede" className="text-fg-2 hover:text-fg underline-offset-4 hover:underline">
            Rede em tabela
          </Link>
        </nav>
      </section>

      <section className="border-border relative border-t">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 py-10 text-sm md:grid-cols-2">
          <div>
            <p className="text-fg font-medium">Mostre a evidência. Mostre a conexão. Mostre a cronologia. Deixe a conclusão para o visitante.</p>
            <p className="text-fg-2 mt-2">
              Toda relação aponta para a fonte que a sustenta. Estar neste mapa não implica ilicitude. Proximidade não é influência; alegação não é prova; coincidência temporal não é causalidade.
            </p>
          </div>
          <div>
            <p className="text-fg-3 mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">Força da evidência</p>
            <ul className="space-y-1.5">
              {CLASSES.map(({ cls, color }) => (
                <li key={cls} className="flex items-center gap-2">
                  <span className="rounded border px-1.5 font-mono text-xs" style={{ borderColor: color, color }}>
                    {cls}
                  </span>
                  <span className="text-fg-2">{EVIDENCE_CLASS_LABEL[cls]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
