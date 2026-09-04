import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { href: "/grafo", label: "Grafo" },
  { href: "/cronologia", label: "Cronologia" },
  { href: "/coincidencias", label: "Coincidências" },
  { href: "/pessoas", label: "Pessoas" },
  { href: "/fontes", label: "Fontes" },
  { href: "/metodologia", label: "Metodologia" },
  { href: "/sobre", label: "Sobre" },
];

export function SiteHeader() {
  return (
    <header className="border-border bg-bg/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="O Novelo Master, página inicial">
          <Logo className="h-7 w-7" />
          <span className="text-fg text-sm font-semibold tracking-[0.18em] uppercase">
            O Novelo Master
          </span>
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-fg-2 hover:text-fg hover:bg-bg-3 rounded px-3 py-1.5 text-sm transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle className="ml-2" />
        </nav>
        <details className="relative md:hidden">
          <summary
            className="text-fg-2 hover:text-fg cursor-pointer list-none rounded px-3 py-1.5 text-sm"
            aria-label="Abrir menu"
          >
            Menu
          </summary>
          <nav
            aria-label="Principal (móvel)"
            className="border-border bg-bg-2 absolute right-0 mt-2 flex w-48 flex-col rounded-md border p-1 shadow-xl"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-fg-2 hover:text-fg hover:bg-bg-3 rounded px-3 py-2 text-sm"
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle className="mt-1 self-start" />
          </nav>
        </details>
      </div>
    </header>
  );
}
