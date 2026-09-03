"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { addMonths, daysBetween, addDays, formatDatePT, todayISO } from "@/lib/graph/dates";
import { ToolButton } from "./ui";

interface TimeMachineProps {
  min: string;
  max: string;
  /** Data atual (YYYY-MM-DD). Ausente = tudo (fim). */
  value?: string;
  onChange: (date: string | undefined) => void;
  playing: boolean;
  onPlay: (on: boolean) => void;
  visibleNodes: number;
  visibleEdges: number;
  reducedMotion: boolean;
}

/**
 * Controle temporal: slider por dia entre min e max, com reprodução mensal
 * ("assistir o novelo se formar"). Sóbrio: só muda o recorte de data.
 */
export function TimeMachine(props: TimeMachineProps) {
  const { min, max, value, onChange, playing, onPlay, visibleNodes, visibleEdges, reducedMotion } = props;
  const id = useId();
  const total = Math.max(1, daysBetween(min, max));
  const current = value ?? max;
  const pos = Math.min(total, Math.max(0, daysBetween(min, current)));
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef = useRef(current);
  useEffect(() => {
    currentRef.current = current;
  });

  useEffect(() => {
    if (!playing) {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      return;
    }
    const start = currentRef.current >= max ? min : currentRef.current;
    onChange(start);
    timer.current = setInterval(
      () => {
        const next = addMonths(currentRef.current, 1);
        if (next >= max) {
          onChange(undefined);
          onPlay(false);
        } else {
          onChange(next);
        }
      },
      reducedMotion ? 900 : 600,
    );
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const years = useMemo(() => {
    const out: { label: string; pct: number }[] = [];
    const y0 = Number(min.slice(0, 4));
    const y1 = Number(max.slice(0, 4));
    for (let y = y0; y <= y1; y++) {
      const d = `${y}-01-01`;
      if (d < min || d > max) continue;
      out.push({ label: String(y), pct: (daysBetween(min, d) / total) * 100 });
    }
    return out;
  }, [min, max, total]);

  return (
    <div className="border-border bg-bg-2/95 pointer-events-auto flex flex-col gap-1.5 rounded-lg border px-3 py-2 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <ToolButton primary active={playing} onClick={() => onPlay(!playing)} aria-label={playing ? "Pausar reprodução" : "Assistir o novelo se formar"}>
          {playing ? "❚❚ Pausar" : "▶ Assistir o novelo se formar"}
        </ToolButton>
        <label htmlFor={id} className="text-fg-2 text-xs">
          Até <span className="text-fg font-medium tabular-nums">{formatDatePT(current)}</span>
        </label>
        {value && (
          <button type="button" onClick={() => onChange(undefined)} className="text-accent text-xs underline underline-offset-2">
            mostrar tudo
          </button>
        )}
        <span className="text-fg-3 ml-auto text-xs tabular-nums" aria-live="polite">
          {visibleNodes} nós · {visibleEdges} arestas
        </span>
      </div>
      <div className="relative">
        <input
          id={id}
          type="range"
          min={0}
          max={total}
          step={1}
          value={pos}
          onChange={(e) => {
            const d = addDays(min, Number(e.target.value));
            onChange(d >= max ? undefined : d);
          }}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={pos}
          aria-valuetext={`até ${formatDatePT(current)}`}
          aria-label="Data limite do grafo"
          className="accent-accent h-1.5 w-full cursor-pointer"
        />
        <div className="text-fg-3 relative mt-0.5 h-3 text-[10px]" aria-hidden="true">
          {years.map((y) => (
            <span key={y.label} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${y.pct}%` }}>
              {y.label}
            </span>
          ))}
          <span className="absolute right-0 tabular-nums">{max === todayISO() ? "hoje" : formatDatePT(max)}</span>
        </div>
      </div>
    </div>
  );
}
