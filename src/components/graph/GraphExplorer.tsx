"use client";

/**
 * Composição do explorador: canvas fullscreen, barra de ferramentas, painéis
 * (nó, aresta, filtros, seleção, caminho, antes/depois, legenda) e time machine.
 * Toda a lógica de visibilidade é derivada (filtros → foco/isolamento → realce).
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { GraphLayerPayload, GraphPayload } from "@/lib/graph/types";
import { buildIndex } from "@/lib/graph/indexes";
import { applyPalette, buildSigmaGraph } from "@/lib/graph/build";
import { readPalette, PALETTE_FALLBACK, type Palette } from "@/lib/graph/style";
import { applyFilters } from "@/lib/graph/filters";
import { inducedSubgraph, neighborhood } from "@/lib/graph/algorithms";
import { todayISO, toFullDate } from "@/lib/graph/dates";
import { GraphCanvas, type CanvasView } from "./GraphCanvas";
import { NodeCard } from "./NodeCard";
import { EdgeCard } from "./EdgeCard";
import { SearchBox } from "./SearchBox";
import { FiltersPanel } from "./FiltersPanel";
import { SelectionPanel } from "./SelectionPanel";
import { PathFinder } from "./PathFinder";
import { TimeMachine } from "./TimeMachine";
import { BeforeAfter } from "./BeforeAfter";
import { Legend } from "./Legend";
import { OrientacaoPanel } from "./OrientacaoPanel";
import { PanelShell, ToolButton } from "./ui";
import { useGraphState } from "./useGraphState";

const EVIDENCE_LAYER_URL = "/data/graph-evidence.json";
const EVIDENCE_CATEGORIES = ["document", "source", "claim", "evidence"] as const;

const DATASETS: Record<string, string> = {
  demo: "/data/graph-demo.json",
  stress: "/data/graph-stress.json",
};

const RM_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(RM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(RM_QUERY).matches,
    () => false,
  );
}

/**
 * Paleta viva: relê as variáveis CSS quando o tema muda (escolha explícita marca data-theme
 * no <html>; "seguir o sistema" muda pelo media query sem tocar no atributo).
 */
function useThemePalette(): Palette {
  const [palette, setPalette] = useState<Palette>(PALETTE_FALLBACK);
  useEffect(() => {
    const sincronizar = () => setPalette(readPalette());
    sincronizar();
    const observador = new MutationObserver(sincronizar);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sincronizar);
    return () => {
      observador.disconnect();
      mq.removeEventListener("change", sincronizar);
    };
  }, []);
  return palette;
}

export function GraphExplorer() {
  const router = useRouter();
  const { state, dispatch, selectNode, dataset } = useGraphState();
  const [loaded, setLoaded] = useState<{
    dataset: string | null;
    payload: GraphPayload | null;
    error: string | null;
  }>({
    dataset: undefined as unknown as string | null,
    payload: null,
    error: null,
  });
  const base = loaded.dataset === dataset ? loaded.payload : null;
  const error = loaded.dataset === dataset ? loaded.error : null;
  const [layerPayload, setLayerPayload] = useState<GraphLayerPayload | null>(null);
  const layerRequest = useRef<Promise<GraphLayerPayload> | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [orientacaoOculta, setOrientacaoOculta] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [layoutToken, setLayoutToken] = useState(0);
  const [layoutRunning, setLayoutRunning] = useState(false);
  const [fitToken, setFitToken] = useState(0);
  const [restoreToken, setRestoreToken] = useState(0);
  const [cameraCommand, setCameraCommand] = useState<{
    token: number;
    action: "rotate-left" | "rotate-right" | "reset-angle";
  } | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const reducedMotion = useReducedMotion();

  /* Carregamento do dataset */
  useEffect(() => {
    const url = DATASETS[dataset ?? ""] ?? "/data/graph.json";
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<GraphPayload>;
      })
      .then((p) => {
        if (!cancelled) setLoaded({ dataset, payload: p, error: null });
      })
      .catch((e: Error) => {
        if (!cancelled) setLoaded({ dataset, payload: null, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [dataset]);

  /*
   * A camada probatória (296 nós e 996 arestas) quase triplicava o download inicial,
   * mesmo desligada. Agora vem em arquivo próprio, buscado quando o leitor a liga.
   */
  const wantsLayer =
    !dataset && EVIDENCE_CATEGORIES.some((c) => state.filters.nodeCategories.has(c));

  const fetchLayer = useCallback(() => {
    if (!layerRequest.current) {
      layerRequest.current = fetch(EVIDENCE_LAYER_URL).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<GraphLayerPayload>;
      });
    }
    return layerRequest.current;
  }, []);

  useEffect(() => {
    if (!wantsLayer || layerPayload) return;
    let cancelled = false;
    fetchLayer()
      .then((l) => {
        if (!cancelled) setLayerPayload(l);
      })
      .catch(() => {
        if (!cancelled) layerRequest.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, [wantsLayer, layerPayload, fetchLayer]);

  /* Derivado: enquanto o leitor quer a camada e ela não chegou, o painel avisa. */
  const layerLoading = wantsLayer && !layerPayload;

  const payload = useMemo(() => {
    if (!base || !layerPayload) return base;
    const nodes = [...base.nodes, ...layerPayload.nodes];
    const edges = [...base.edges, ...layerPayload.edges];
    return { ...base, nodes, edges, stats: { ...base.stats, nodes: nodes.length, edges: edges.length } };
  }, [base, layerPayload]);

  const index = useMemo(() => (payload ? buildIndex(payload) : null), [payload]);
  const palette = useThemePalette();
  /* Topologia não depende do tema: a troca de tema só repinta (ver applyPalette). */
  const graph = useMemo(() => (index ? buildSigmaGraph(index, palette) : null), [index]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (graph) applyPalette(graph, palette);
  }, [graph, palette]);

  /*
   * Recorte pequeno: a câmera fica onde estava e os poucos nós restantes podem cair fora do
   * enquadramento — a tela parece vazia sem estar. Reenquadra só quando o conjunto encolhe muito,
   * para não roubar a câmera do leitor no uso normal.
   */
  const visiveisAnterior = useRef<number | null>(null);

  /* Visibilidade derivada */
  const filtered = useMemo(
    () => (index ? applyFilters(index, state.filters) : null),
    [index, state.filters],
  );

  const visible = useMemo(() => {
    if (!index || !filtered) return null;
    const vis = { nodes: filtered.nodes, edges: filtered.edges };
    if (state.isolate && state.selection.length > 0) {
      const sub = inducedSubgraph(index, state.selection, state.isolate.withNeighbors, vis);
      return { nodes: sub.nodes, edges: sub.edges };
    }
    if (state.focus && index.nodeById.has(state.focus.root)) {
      const sub = neighborhood(index, state.focus.root, state.focus.depth, vis);
      return { nodes: sub.nodes, edges: sub.edges };
    }
    return vis;
  }, [index, filtered, state.isolate, state.selection, state.focus]);

  const highlight = useMemo(() => {
    const p = state.path.results[state.path.active];
    if (!p) return null;
    return { nodes: new Set(p.nodes), edges: new Set(p.edges) };
  }, [state.path.results, state.path.active]);

  const view: CanvasView | null = useMemo(
    () =>
      visible
        ? {
            visibleNodes: visible.nodes,
            visibleEdges: visible.edges,
            selectedNode: state.selectedNode,
            selectedEdge: state.selectedEdge,
            selection: new Set(state.selection),
            highlight,
            pinnedNodes: new Set(state.pinnedNodes),
          }
        : null,
    [
      visible,
      state.selectedNode,
      state.selectedEdge,
      state.selection,
      state.pinnedNodes,
      highlight,
    ],
  );

  /*
   * Datas em que algo de fato entra no mapa. Entre 2012 e meados de 2017 o corpus tem quase nada:
   * reproduzir mês a mês gastava dezenas de passos numa tela parada, e quem clicava desistia antes
   * do primeiro nó aparecer.
   */
  const marcosTemporais = useMemo(() => {
    if (!payload) return [];
    /* first_seen e since podem ser parciais ("2000", "2019-05"): normalizar antes de comparar. */
    const datas = new Set<string>();
    for (const n of payload.nodes) if (n.first_seen) datas.add(toFullDate(n.first_seen));
    for (const e of payload.edges) if (e.since) datas.add(toFullDate(e.since));
    return [...datas].sort();
  }, [payload]);

  /* Pontos de partida: os nós mais conectados do recorte atual, que são o miolo do caso. */
  const atalhosDePartida = useMemo(() => {
    if (!index || !view) return [];
    return [...view.visibleNodes]
      .map((id) => index.nodeById.get(id))
      .filter((n): n is NonNullable<typeof n> => !!n && (n.kind === "person" || n.kind === "organization"))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 3)
      .map((n) => ({ id: n.id, label: n.label }));
  }, [index, view]);

  useEffect(() => {
    const n = visible?.nodes.size ?? null;
    const antes = visiveisAnterior.current;
    if (n === null) return;
    visiveisAnterior.current = n;
    if (antes === null || n === 0) return;
    if (n <= 25 && n !== antes) setFitToken((t) => t + 1);
  }, [visible]);

  const selectedNode =
    state.selectedNode && index && view?.visibleNodes.has(state.selectedNode)
      ? index.nodeById.get(state.selectedNode)
      : undefined;
  const selectedEdge =
    state.selectedEdge && index && view?.visibleEdges.has(state.selectedEdge)
      ? index.edgeById.get(state.selectedEdge)
      : undefined;
  const selectionOutsideSlice =
    (state.selectedNode && !view?.visibleNodes.has(state.selectedNode)) ||
    (state.selectedEdge && !view?.visibleEdges.has(state.selectedEdge));

  const openNode = useCallback(
    (id: string) => {
      const n = index?.nodeById.get(id);
      if (n && !n.href.startsWith("/grafo")) router.push(n.href);
    },
    [index, router],
  );

  /* Time machine: limites */
  const minDate = payload?.stats.min_date ?? "2018-01-01";
  const maxDate =
    payload?.stats.max_date && payload.stats.max_date > todayISO()
      ? payload.stats.max_date
      : todayISO();

  const modeBanner = state.filters.officialOnly || state.filters.documentedOnly;

  /* ---------------------------------------------------------------- */
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <p className="text-fg font-medium">Não foi possível carregar o grafo.</p>
          <p className="text-fg-3 mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }
  if (!payload || !index || !graph || !view) {
    return (
      <div className="flex h-full items-center justify-center" role="status" aria-live="polite">
        <p className="text-fg-3 text-sm">Carregando o novelo…</p>
      </div>
    );
  }
  if (payload.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <p className="text-fg font-medium">Corpus ainda vazio.</p>
          <p className="text-fg-2 mt-2 text-sm">
            O grafo é gerado a partir de registros revisados em <code>/data</code>. Veja a{" "}
            <Link href="/metodologia" className="text-accent underline underline-offset-2">
              metodologia
            </Link>{" "}
            ou explore o{" "}
            <Link href="/grafo?dataset=demo" className="text-accent underline underline-offset-2">
              dataset sintético de demonstração
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const ariaLabel = `Grafo com ${view.visibleNodes.size} nós e ${view.visibleEdges.size} arestas visíveis, de ${payload.stats.nodes} nós e ${payload.stats.edges} arestas no total.`;

  const panel = (() => {
    switch (state.panel) {
      case "node":
        return selectedNode ? (
          <NodeCard
            index={index}
            node={selectedNode}
            visible={{ nodes: view.visibleNodes, edges: view.visibleEdges }}
            focusDepth={state.focus?.root === selectedNode.id ? state.focus.depth : null}
            inSelection={state.selection.includes(selectedNode.id)}
            pinned={state.pinnedNodes.includes(selectedNode.id)}
            onClose={() => selectNode(null)}
            onSelectNode={(id) => selectNode(id, true)}
            onFocus={(depth) =>
              depth
                ? dispatch({ type: "focus", root: selectedNode.id, depth })
                : dispatch({ type: "clearFocus" })
            }
            onAddToSelection={() => dispatch({ type: "addToSelection", id: selectedNode.id })}
            onPathFrom={() => {
              dispatch({ type: "panel", panel: "path" });
              dispatch({
                type: "path",
                patch: { from: selectedNode.id, to: null, results: [], active: 0 },
              });
            }}
            onBeforeAfter={() => dispatch({ type: "panel", panel: "beforeAfter" })}
            onTogglePinned={() => dispatch({ type: "togglePinned", id: selectedNode.id })}
          />
        ) : null;
      case "edge":
        return selectedEdge ? (
          <EdgeCard
            index={index}
            edge={selectedEdge}
            sourceIndex={payload.source_index}
            onClose={() => dispatch({ type: "selectEdge", id: null })}
            onSelectNode={(id) => selectNode(id, true)}
          />
        ) : null;
      case "filters":
        return (
          <FiltersPanel
            filters={state.filters}
            dispatch={dispatch}
            visibleNodes={view.visibleNodes.size}
            visibleEdges={view.visibleEdges.size}
            layerLoading={layerLoading}
            onClose={() => dispatch({ type: "panel", panel: null })}
          />
        );
      case "selection":
        return (
          <SelectionPanel
            index={index}
            selection={state.selection}
            vis={{ nodes: filtered!.nodes, edges: filtered!.edges }}
            isolate={state.isolate}
            onIsolate={(v) => dispatch({ type: "isolate", value: v })}
            onRemove={(id) => dispatch({ type: "removeFromSelection", id })}
            onClear={() => dispatch({ type: "clearSelection" })}
            onSelectNode={(id) => selectNode(id, true)}
            onClose={() => dispatch({ type: "panel", panel: null })}
            onExit={() => dispatch({ type: "setMultiSelect", on: false })}
          />
        );
      case "path":
        return (
          <PathFinder
            index={index}
            path={state.path}
            vis={{ nodes: filtered!.nodes, edges: filtered!.edges }}
            onChange={(patch) => dispatch({ type: "path", patch })}
            onSelectNode={(id) => {
              dispatch({ type: "panel", panel: "node" });
              selectNode(id, true);
            }}
            onClose={() => dispatch({ type: "panel", panel: null })}
          />
        );
      case "beforeAfter":
        return selectedNode ? (
          <BeforeAfter
            index={index}
            node={selectedNode}
            onSelectNode={(id) => selectNode(id, true)}
            onClose={() => dispatch({ type: "panel", panel: "node" })}
          />
        ) : null;
      default:
        /*
         * Nada selecionado: em vez de 40% da tela vazia, o painel ensina a ler o mapa e oferece
         * três pontos de partida. Some para sempre depois de dispensado.
         */
        if (orientacaoOculta) return null;
        return (
          <OrientacaoPanel
            atalhos={atalhosDePartida}
            onEscolher={(id) => selectNode(id, true)}
            onFechar={() => setOrientacaoOculta(true)}
          />
        );
    }
  })();

  return (
    <div className="relative h-full w-full overflow-hidden" data-testid="graph-explorer">
      <GraphCanvas
        graph={graph}
        index={index}
        palette={palette}
        view={view}
        onSelectNode={(id) => selectNode(id)}
        onSelectEdge={(id) => dispatch({ type: "selectEdge", id })}
        onOpenNode={openNode}
        onEscape={() => dispatch({ type: "escape" })}
        onFocusSearch={() => searchRef.current?.focus()}
        cameraTarget={state.cameraTarget}
        layoutToken={layoutToken}
        onLayoutRunning={setLayoutRunning}
        fitToken={fitToken}
        restoreToken={restoreToken}
        cameraCommand={cameraCommand}
        reducedMotion={reducedMotion}
        ariaLabel={ariaLabel}
      />

      {/*
        Recorte vazio: antes a tela ficava preta, sem mensagem e sem reenquadramento, e o leitor
        não tinha como saber se o site quebrou ou se o filtro é que zerou.
      */}
      {view.visibleNodes.size === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
          <div className="border-border-strong bg-bg-2/95 pointer-events-auto max-w-sm rounded-lg border p-5 text-center shadow-2xl backdrop-blur">
            <p className="text-fg text-sm font-medium">Nenhum nó neste recorte.</p>
            <p className="text-fg-2 mt-1.5 text-xs leading-relaxed">
              Os filtros ativos, o recorte temporal ou o foco em um nó excluíram tudo o que existe no
              corpus.
            </p>
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "resetFilters" });
                dispatch({ type: "clearFocus" });
              }}
              className="bg-accent text-bg hover:bg-accent/90 mt-4 inline-flex h-9 items-center rounded-md px-4 text-xs font-medium"
            >
              Mostrar tudo
            </button>
          </div>
        </div>
      )}

      {/* Barra de ferramentas */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
          <div className="min-w-0 flex-1 md:w-64 md:flex-none">
            <SearchBox
              index={index}
              only={view.visibleNodes}
              ariaLabel="Buscar pessoa, organização ou evento"
              placeholder="Buscar no novelo…"
              inputRef={searchRef}
              onPick={(id) => selectNode(id, true)}
              onClearScope={() => {
                dispatch({ type: "resetFilters" });
                dispatch({ type: "clearFocus" });
              }}
            />
          </div>
          <ToolButton
            active={state.panel === "filters"}
            onClick={() =>
              dispatch({ type: "panel", panel: state.panel === "filters" ? null : "filters" })
            }
          >
            Filtros
          </ToolButton>
          <ToolButton
            className="md:hidden"
            active={toolsOpen}
            aria-expanded={toolsOpen}
            onClick={() => setToolsOpen((v) => !v)}
          >
            Ferramentas
          </ToolButton>
        </div>

        {/*
         * No celular a barra ocupava três linhas e comia um terço da tela antes do grafo.
         * Aqui as ferramentas secundárias ficam atrás de um botão; no desktop seguem visíveis.
         */}
        <div
          className={`pointer-events-auto ${toolsOpen ? "flex" : "hidden"} flex-wrap items-center gap-1.5 md:flex`}
        >
          <ToolButton
            active={state.multiSelect}
            onClick={() => dispatch({ type: "setMultiSelect", on: !state.multiSelect })}
          >
            Seleção múltipla
          </ToolButton>
          <ToolButton
            active={state.panel === "path"}
            onClick={() =>
              dispatch({ type: "panel", panel: state.panel === "path" ? null : "path" })
            }
          >
            Como A se conecta a B?
          </ToolButton>
          <ToolButton
            active={legendOpen}
            /* A legenda completa substitui a orientação: a compacta já está dentro dela. */
            onClick={() => {
              setLegendOpen((v) => !v);
              setOrientacaoOculta(true);
            }}
            aria-expanded={legendOpen}
          >
            Legenda
          </ToolButton>
          <ToolButton onClick={() => setFitToken((t) => t + 1)} aria-label="Ajustar o grafo à tela">
            Ajustar
          </ToolButton>
          <ToolButton
            active={layoutRunning}
            onClick={() => setLayoutToken((t) => t + 1)}
            title="Recalcula as posições dos nós; o dado não muda."
          >
            {layoutRunning ? "Parar" : "Reorganizar"}
          </ToolButton>
          <ToolButton
            onClick={() => setRestoreToken((t) => t + 1)}
            aria-label="Restaurar o layout original"
          >
            Restaurar
          </ToolButton>
          {state.pinnedNodes.length > 0 && (
            <ToolButton
              onClick={() => dispatch({ type: "clearPinned" })}
              aria-label="Desafixar todos os nós"
            >
              Desafixar todos ({state.pinnedNodes.length})
            </ToolButton>
          )}
          <ToolButton
            onClick={() =>
              setCameraCommand((current) => ({
                token: (current?.token ?? 0) + 1,
                action: "rotate-left",
              }))
            }
            aria-label="Girar o grafo para a esquerda"
          >
            ↺
          </ToolButton>
          <ToolButton
            onClick={() =>
              setCameraCommand((current) => ({
                token: (current?.token ?? 0) + 1,
                action: "rotate-right",
              }))
            }
            aria-label="Girar o grafo para a direita"
          >
            ↻
          </ToolButton>
          <ToolButton
            onClick={() =>
              setCameraCommand((current) => ({
                token: (current?.token ?? 0) + 1,
                action: "reset-angle",
              }))
            }
            aria-label="Remover a rotação do grafo"
          >
            0°
          </ToolButton>
          {(state.focus || state.isolate) && (
            <ToolButton onClick={() => dispatch({ type: "escape" })} aria-label="Sair do foco">
              Sair do foco
            </ToolButton>
          )}
          {/*
            No celular o canvas captura o toque e o rodapé é inalcançável: quem não consegue usar o
            grafo ficava sem nenhuma saída visível para a alternativa em tabela.
          */}
          <Link
            href="/rede"
            className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 inline-flex h-11 items-center rounded-md border px-3 text-xs transition-colors md:hidden"
          >
            Ver em tabela
          </Link>
          <Link
            href="/rede"
            className="text-fg-3 hover:text-fg ml-auto hidden text-xs underline-offset-2 hover:underline md:inline"
          >
            Ver a mesma rede em tabela
          </Link>
        </div>
        {modeBanner && (
          <div
            role="status"
            className="border-accent/60 bg-accent/15 text-fg pointer-events-auto self-start rounded-md border px-3 py-1.5 text-xs font-medium tracking-wide"
          >
            {state.filters.officialOnly && "MODO: APENAS FONTES OFICIAIS"}
            {state.filters.officialOnly && state.filters.documentedOnly && " · "}
            {state.filters.documentedOnly && "MODO: SOMENTE FATOS DOCUMENTADOS"}
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "filters", patch: { officialOnly: false, documentedOnly: false } })
              }
              className="text-accent ml-3 underline underline-offset-2"
            >
              desativar
            </button>
          </div>
        )}
        {selectionOutsideSlice && (
          <div
            role="status"
            className="border-border bg-bg-2 text-fg-2 pointer-events-auto self-start rounded-md border px-3 py-1.5 text-xs"
          >
            A seleção ficou fora do recorte atual.
            <button
              type="button"
              onClick={() => {
                selectNode(null);
                dispatch({ type: "selectEdge", id: null });
              }}
              className="text-accent ml-3 underline underline-offset-2"
            >
              limpar seleção
            </button>
          </div>
        )}
        {state.multiSelect && state.panel !== "selection" && (
          <div role="status" className="text-fg-2 pointer-events-auto self-start text-xs">
            Seleção múltipla ativa: clique nos nós para adicioná-los.
          </div>
        )}
      </div>

      {/* Legenda */}
      {legendOpen && (
        <div className="pointer-events-auto absolute bottom-24 left-3 z-10 w-80 max-w-[calc(100%-1.5rem)] md:bottom-28">
          <PanelShell title="Legenda" onClose={() => setLegendOpen(false)}>
            <div className="mt-2">
              <Legend />
            </div>
          </PanelShell>
        </div>
      )}

      {/*
        Painel lateral (desktop) / folha inferior (móvel). No celular a folha cobria a máquina do
        tempo, que fica logo abaixo: com um nó selecionado o controle temporal ficava inacessível.
        Por isso ela para acima dela.
      */}
      {panel && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[104px] z-20 max-h-[52dvh] md:inset-x-auto md:top-14 md:right-3 md:bottom-28 md:max-h-none md:w-96">
          <div className="pointer-events-auto flex h-full max-h-[52dvh] flex-col md:max-h-full">
            {panel}
          </div>
        </div>
      )}

      {/* Time machine */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3">
        <div className="mx-auto max-w-3xl">
          <TimeMachine
            min={minDate}
            max={maxDate}
            marcos={marcosTemporais}
            value={state.filters.dateUntil}
            onChange={(d) => dispatch({ type: "filters", patch: { dateUntil: d } })}
            playing={state.playing}
            onPlay={(on) => dispatch({ type: "playing", on })}
            visibleNodes={view.visibleNodes.size}
            visibleEdges={view.visibleEdges.size}
            reducedMotion={reducedMotion}
            undatedEdgesExcluded={filtered?.undatedEdgesExcluded ?? 0}
          />
        </div>
      </div>

      <p className="sr-only">
        <Link href="/rede">Ver a mesma rede em tabela</Link>
      </p>
    </div>
  );
}
