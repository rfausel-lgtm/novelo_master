import type { ReactNode } from "react";

/** Container editorial padrão (max-w-5xl). */
export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 ${className}`}>{children}</div>;
}

/** Cabeçalho de página de índice. */
export function PageTitle({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 space-y-3">
      {eyebrow ? <p className="text-fg-3 font-mono text-[11px] tracking-[0.2em] uppercase">{eyebrow}</p> : null}
      <h1 className="text-fg text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {lede ? <p className="text-fg-2 max-w-2xl text-sm leading-relaxed sm:text-base">{lede}</p> : null}
      {children}
    </header>
  );
}
