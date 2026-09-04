import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-fg-3 font-mono text-xs tracking-[0.2em] uppercase">404</p>
      <h1 className="text-fg mt-2 text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-fg-2 mt-3 text-sm">O registro pode não existir ou ainda não ter sido publicado após revisão.</p>
      {/* Antes so oferecia o grafo, que e o artefato de maior custo para quem se perdeu. */}
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {[
          { href: "/", label: "Início" },
          { href: "/grafo", label: "Grafo" },
          { href: "/cronologia", label: "Cronologia" },
          { href: "/pessoas", label: "Pessoas" },
          { href: "/organizacoes", label: "Organizações" },
          { href: "/fontes", label: "Fontes" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 rounded-md border px-3 py-1.5 text-sm transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>
      <p className="text-fg-3 mt-5 text-xs">
        Se o endereço veio de um link publicado, escreva para{" "}
        <a href="/sobre" className="hover:text-fg underline underline-offset-2">
          contato
        </a>
        .
      </p>
    </div>
  );
}
