"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { EvidenceClass } from "@/lib/schema";
import { EVIDENCE_CLASS_LABEL } from "@/lib/schema";
import { EVIDENCE_VAR } from "@/lib/graph/style";

/** Botão pequeno da barra de ferramentas / painéis. */
export function ToolButton({
  active,
  primary,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; primary?: boolean }) {
  const base =
    /* 44px de alvo no toque, 32 no ponteiro: no celular a barra era uma fileira de alvos pequenos. */
    "inline-flex h-11 items-center gap-1.5 rounded-md border px-3 text-xs font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:px-2.5";
  const tone = primary
    ? active
      ? "border-accent bg-accent text-bg"
      : "border-accent/60 bg-bg-2/90 text-accent hover:bg-accent/15"
    : active
      ? "border-fg-2/60 bg-bg-3 text-fg"
      : "border-border-strong bg-bg-2/90 text-fg-2 hover:border-fg-3 hover:text-fg";
  return (
    <button type="button" aria-pressed={active} className={`${base} ${tone} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** Cabeçalho de seção em versalete, usado nos cards. */
export function SectionHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3 id={id} className="text-fg-3 mt-4 mb-1.5 text-[10.5px] font-semibold tracking-[0.14em] uppercase">
      {children}
    </h3>
  );
}

/** Container de painel lateral (desktop) / folha inferior (móvel). */
export function PanelShell({
  title,
  onClose,
  children,
  labelledBy,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="border-border-strong bg-bg-2/95 pointer-events-auto flex max-h-full flex-col rounded-t-lg border shadow-2xl backdrop-blur md:rounded-lg"
    >
      <header className="border-border flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <div className="min-w-0 flex-1 text-sm font-semibold">{title}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="text-fg-3 hover:bg-bg-3 hover:text-fg flex h-10 w-10 shrink-0 items-center justify-center rounded md:h-7 md:w-7"
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 text-sm">{children}</div>
    </section>
  );
}

export function EvidenceBadge({ cls, small }: { cls: EvidenceClass; small?: boolean }) {
  const color = `var(${EVIDENCE_VAR[cls]})`;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${small ? "px-1 text-[10px]" : "px-1.5 py-0.5 text-xs"}`}
      style={{ borderColor: color, color }}
      title={EVIDENCE_CLASS_LABEL[cls]}
    >
      <span className="font-mono">{cls}</span>
      {!small && <span>{EVIDENCE_CLASS_LABEL[cls]}</span>}
    </span>
  );
}

export function Chip({ color, children, title }: { color?: string; children: ReactNode; title?: string }) {
  return (
    <span className="bg-bg-3 text-fg-2 inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px]" title={title}>
      {color && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

export function Counter({ label, value, title }: { label: string; value: number; title?: string }) {
  return (
    <div className="bg-bg-3/70 rounded px-2 py-1.5" title={title}>
      <div className="text-fg text-base leading-none font-semibold tabular-nums">{value}</div>
      <div className="text-fg-3 mt-1 text-[10.5px] leading-none">{label}</div>
    </div>
  );
}
