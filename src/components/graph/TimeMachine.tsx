"use client";

import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { addMonths, formatDatePT, todayISO } from "@/lib/graph/dates";
import { ToolButton } from "./ui";

interface TimeMachineProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
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
  undatedEdgesExcluded: number;
  /** Datas em que algo entra no mapa, em ordem. A reprodução salta de uma para a outra. */
  marcos: string[];
}

/**
 * Controle temporal: slider por dia entre min e max, com reprodução mensal
 * ("assistir o novelo se formar"). Sóbrio: só muda o recorte de data.
 */
export function TimeMachine(props: TimeMachineProps) {
  const {
    expanded,
    onExpandedChange,
    min,
    max,
    value,
    onChange,
    playing,
    onPlay,
    visibleNodes,
    visibleEdges,
    reducedMotion,
    undatedEdgesExcluded,
    marcos,
  } = props;
  const id = useId();
  const current = value ?? max;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef = useRef(current);
  const marcosRef = useRef(marcos);
  useEffect(() => {
    currentRef.current = current;
    marcosRef.current = marcos;
  });

  useEffect(() => {
    if (!playing) {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      return;
    }
    /*
     * Salta de marco em marco: mês vazio não vira passo. Sem marcos (dataset sem datas), volta ao
     * avanço mensal.
     */
    const proximo = (de: string) => {
      const lista = marcosRef.current;
      return lista.length > 0 ? lista.find((d) => d > de) : addMonths(de, 1);
    };
    const start = currentRef.current >= max ? (marcosRef.current[0] ?? min) : currentRef.current;
    onChange(start);
    timer.current = setInterval(
      () => {
        const next = proximo(currentRef.current);
        if (!next || next >= max) {
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

  /**
   * A régua anda por MARCO, não por dia.
   *
   * Medido no acervo em 12/09/2026: de 440 elementos datados, 2000–2018 somam 5% e ocupavam ~70% da
   * barra; 2024–2026 somam 60% e ocupavam ~11%. Arrastar dois terços do curso percorria um vigésimo
   * do caso — a régua era quase toda inútil, e tudo se amontoava na ponta direita.
   *
   * `marcos` são as datas em que algo de fato entra no grafo (primeira aparição de nó, início de
   * relação). Indexar por elas dá passo de tamanho igual em CONTEÚDO: ano sem nada encolhe, ano
   * cheio se abre. De quebra, arrastar e reproduzir passam a andar na mesma unidade — antes o play
   * saltava de marco em marco enquanto o arraste corria por dia.
   *
   * `max` entra no fim da escala para a ponta direita continuar significando "tudo".
   */
  const escala = useMemo(() => {
    const datas = [...new Set([...marcos.filter((d) => d >= min && d <= max), max])].sort();
    return datas.length > 1 ? datas : [min, max];
  }, [marcos, min, max]);

  const posicaoDe = useCallback(
    (data: string) => {
      let i = escala.findIndex((d) => d >= data);
      if (i < 0) i = escala.length - 1;
      return i;
    },
    [escala],
  );

  /**
   * Rótulo de ano na posição real dele dentro da escala — e só quando couber.
   *
   * Com a escala por marco os anos vazios se juntam, então a regra antiga (`i % 5`) ora escondia
   * rótulo que cabia, ora deixava dois colados. Aqui o critério é a distância até o último rótulo
   * já desenhado, que é o que decide de fato se um número lê ou vira borrão.
   */
  const years = useMemo(() => {
    const out: { label: string; pct: number }[] = [];
    const y0 = Number(min.slice(0, 4));
    const y1 = Number(max.slice(0, 4));
    const ultimoTopo = escala.length - 1;
    let ultimoPct = -Infinity;
    for (let y = y0; y <= y1; y++) {
      const d = `${y}-01-01`;
      if (d < min || d > max) continue;
      const pct = (posicaoDe(d) / ultimoTopo) * 100;
      // 7% ≈ 45 px numa barra de 640, que é o necessário para quatro dígitos não encostarem.
      if (pct - ultimoPct < 7) continue;
      // A borda direita é do rótulo da data final; ano colado nela sobrepõe.
      if (pct > 88) continue;
      out.push({ label: String(y), pct });
      ultimoPct = pct;
    }
    return out;
  }, [min, max, escala, posicaoDe]);

  return (
    <div className="graph-time-machine border-border bg-bg-2/95 pointer-events-auto flex flex-col gap-1.5 rounded-lg border px-3 py-2 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-2 md:hidden">
        <button
          type="button"
          className="min-h-11 text-left text-sm"
          aria-expanded={expanded}
          aria-controls={`${id}-details`}
          onClick={() => onExpandedChange(!expanded)}
        >
          <span className="text-fg-3 block text-xs">Recorte temporal</span>
          <span className="font-medium">
            Até {formatDatePT(current)} <span aria-hidden="true">{expanded ? "⌄" : "⌃"}</span>
          </span>
        </button>
        <span className="text-fg-3 text-xs tabular-nums">
          {visibleNodes} nós · {visibleEdges} arestas
        </span>
        {playing && (
          <button className="min-h-11 px-2 text-sm" onClick={() => onPlay(false)}>
            Pausar
          </button>
        )}
      </div>
      <div
        id={`${id}-details`}
        className={expanded ? "time-details" : "time-details hidden md:block"}
      >
        <div className="flex flex-wrap items-center gap-2">
          <ToolButton
            primary
            active={playing}
            onClick={() => onPlay(!playing)}
            aria-label={playing ? "Pausar reprodução" : "Assistir o novelo se formar"}
          >
            {playing ? "❚❚ Pausar" : "▶ Assistir o novelo se formar"}
          </ToolButton>
          <label htmlFor={id} className="text-fg-2 text-xs">
            Até <span className="text-fg font-medium tabular-nums">{formatDatePT(current)}</span>
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="text-accent text-xs underline underline-offset-2"
            >
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
            max={escala.length - 1}
            step={1}
            value={posicaoDe(current)}
            onChange={(e) => {
              const d = escala[Number(e.target.value)] ?? max;
              onChange(d >= max ? undefined : d);
            }}
            aria-valuemin={0}
            aria-valuemax={escala.length - 1}
            aria-valuenow={posicaoDe(current)}
            aria-valuetext={`até ${formatDatePT(current)}`}
            aria-label="Data limite do grafo"
            className="accent-accent h-11 w-full cursor-pointer md:h-1.5"
          />
          <div className="text-fg-3 relative mt-0.5 h-3 text-[10px]" aria-hidden="true">
            {years.map((y) => (
              <span
                key={y.label}
                className="absolute -translate-x-1/2 tabular-nums"
                style={{ left: `${y.pct}%` }}
              >
                {y.label}
              </span>
            ))}
            {/* No celular colidiria com o último ano; a data já aparece em "Até ..." acima. */}
            <span className="absolute right-0 hidden tabular-nums sm:block">
              {max === todayISO() ? "hoje" : formatDatePT(max)}
            </span>
          </div>
        </div>
        {value && undatedEdgesExcluded > 0 && (
          <p className="text-fg-3 text-[10px]" role="status">
            {undatedEdgesExcluded}{" "}
            {undatedEdgesExcluded === 1
              ? "relação sem data ficou oculta"
              : "relações sem data ficaram ocultas"}{" "}
            neste recorte.
          </p>
        )}
      </div>
    </div>
  );
}
