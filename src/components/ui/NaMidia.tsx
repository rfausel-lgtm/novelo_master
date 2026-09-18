import Image from "next/image";
import { MEDIA_COVERAGE } from "@/lib/media-coverage";
import { formatPartialDate } from "@/lib/format";

/**
 * "Na mídia": veículos que publicaram sobre o Novelo Master.
 *
 * O trecho citado é o que sustenta a seção — mostra que o veículo falou do projeto, e não que o
 * projeto fala do veículo. A ressalva de vínculo fecha o bloco porque logo de terceiro ao lado do
 * nome do site, sem ela, sugere parceria que não existe.
 *
 * Cada logo aparece na marca original do veículo; nada de recolorir, recortar ou compor com o
 * nosso. A única adaptação é de legibilidade: no tema escuro entra a versão clara do mesmo logo.
 */
export function NaMidia() {
  if (MEDIA_COVERAGE.length === 0) return null;
  return (
    <section aria-labelledby="na-midia" className="mt-10 w-full max-w-2xl text-left">
      <h2 id="na-midia" className="text-fg-3 text-[11px] font-semibold tracking-[0.14em] uppercase">
        Na mídia
      </h2>
      <ul className="mt-2 space-y-3">
        {MEDIA_COVERAGE.map((m) => (
          <li key={m.url}>
            <a
              href={m.url}
              target="_blank"
              rel="noopener"
              className="border-border bg-bg-2 hover:border-border-strong flex flex-col items-start gap-5 rounded-lg border p-5 transition-colors sm:flex-row sm:items-center sm:gap-7"
            >
              <span className="flex shrink-0 flex-col items-start gap-2 sm:w-[168px] sm:items-center">
                <Image
                  src={m.logo.dark}
                  alt={m.logo.alt}
                  width={m.logo.width}
                  height={m.logo.height}
                  className="logo-veiculo-escuro h-10 w-auto"
                />
                <Image
                  src={m.logo.light}
                  alt={m.logo.alt}
                  width={m.logo.width}
                  height={m.logo.height}
                  className="logo-veiculo-claro h-10 w-auto"
                />
                <time dateTime={m.date} className="text-fg-3 font-mono text-[10px]">
                  {formatPartialDate(m.date)}
                </time>
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-fg block font-semibold">{m.title}</span>
                {m.quote && (
                  <span className="border-accent text-fg-2 mt-2 block border-l-2 pl-4 text-sm leading-relaxed">
                    “{m.quote}”
                  </span>
                )}
                <span className="text-fg-3 mt-2 block font-mono text-[11px]">
                  {[m.outlet, m.author, m.section].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="text-accent flex shrink-0 items-center gap-1.5 text-sm">
                Ler a matéria
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17 17 7" />
                  <path d="M9 7h8v8" />
                </svg>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-fg-3 mt-2 text-xs leading-relaxed">
        O Novelo Master não tem vínculo com os veículos listados. Marcas e conteúdos citados
        pertencem a seus titulares.
      </p>
    </section>
  );
}
