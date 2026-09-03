"use client";

/**
 * Ciclo de vida do Sigma: cria na montagem, mata na desmontagem, redimensiona
 * com ResizeObserver. Hover/seleção/filtros são aplicados por reducers a
 * partir de refs (sem mutar o grafo e sem recriar o Sigma).
 */
import { useEffect, useRef, useState } from "react";
import Sigma from "sigma";
import type { EdgeDisplayData, NodeDisplayData } from "sigma/types";
import type { Settings } from "sigma/settings";
import type { NoveloGraph, SigmaEdgeAttributes, SigmaNodeAttributes } from "@/lib/graph/build";
import type { GraphIndex } from "@/lib/graph/indexes";
import { createLayoutRunner, type LayoutRunner } from "@/lib/graph/layout-worker";
import { createEdgeProgramClasses } from "@/lib/graph/programs";
import { DIM, type Palette } from "@/lib/graph/style";

export interface CanvasView {
  visibleNodes: ReadonlySet<string>;
  visibleEdges: ReadonlySet<string>;
  selectedNode: string | null;
  selectedEdge: string | null;
  selection: ReadonlySet<string>;
  highlight: { nodes: ReadonlySet<string>; edges: ReadonlySet<string> } | null;
}

export interface GraphCanvasProps {
  graph: NoveloGraph;
  index: GraphIndex;
  palette: Palette;
  view: CanvasView;
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
  onOpenNode: (id: string) => void;
  onEscape: () => void;
  onFocusSearch: () => void;
  cameraTarget: { id: string; token: number } | null;
  /** Incrementa para pedir "Reorganizar" (FA2 no worker por alguns segundos). */
  layoutToken: number;
  onLayoutRunning?: (running: boolean) => void;
  /** Incrementa para pedir "Ajustar à tela". */
  fitToken: number;
  reducedMotion: boolean;
  ariaLabel: string;
}

interface Context {
  nodes: ReadonlySet<string>;
  edges: ReadonlySet<string>;
  emphasis: ReadonlySet<string>;
  forceLabels: ReadonlySet<string>;
}

type NodeData = NodeDisplayData & { dimmed?: boolean };
type NoveloSigma = Sigma<SigmaNodeAttributes, SigmaEdgeAttributes>;

const MAX_FORCED_LABELS = 40;

export function GraphCanvas(props: GraphCanvasProps) {
  const {
    graph,
    index,
    palette,
    view,
    onSelectNode,
    onSelectEdge,
    onOpenNode,
    onEscape,
    onFocusSearch,
    cameraTarget,
    layoutToken,
    onLayoutRunning,
    fitToken,
    reducedMotion,
    ariaLabel,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<NoveloSigma | null>(null);
  const viewRef = useRef(view);
  const hoverRef = useRef<string | null>(null);
  const ctxRef = useRef<Context | null>(null);
  const neighborCache = useRef(new Map<string, { nodes: Set<string>; edges: Set<string> }>());
  const layoutRef = useRef<LayoutRunner | null>(null);
  const callbacks = useRef({ onSelectNode, onSelectEdge, onOpenNode, onEscape, onFocusSearch, onLayoutRunning });
  const reducedMotionRef = useRef(reducedMotion);
  const [webglError, setWebglError] = useState<string | null>(null);
  useEffect(() => {
    callbacks.current = { onSelectNode, onSelectEdge, onOpenNode, onEscape, onFocusSearch, onLayoutRunning };
    reducedMotionRef.current = reducedMotion;
  });

  /* Vizinhança memoizada por nó (calculada sob demanda a partir do índice). */
  const neighborhoodOf = (id: string) => {
    let hit = neighborCache.current.get(id);
    if (!hit) {
      const nodes = new Set<string>([id]);
      const edges = new Set<string>();
      for (const a of index.adjacency.get(id) ?? []) {
        nodes.add(a.other);
        edges.add(a.edge);
      }
      hit = { nodes, edges };
      neighborCache.current.set(id, hit);
    }
    return hit;
  };

  const computeContext = (): Context | null => {
    const v = viewRef.current;
    const hover = hoverRef.current;
    const emphasis = new Set<string>();
    if (v.selectedNode) emphasis.add(v.selectedNode);
    for (const id of v.selection) emphasis.add(id);
    if (hover) emphasis.add(hover);

    const focusNode = hover ?? v.selectedNode;
    if (focusNode && graph.hasNode(focusNode)) {
      const nb = neighborhoodOf(focusNode);
      const nodes = new Set(nb.nodes);
      const edges = new Set(nb.edges);
      // mantém a seleção múltipla e o caminho realçados junto com o hover
      for (const id of v.selection) nodes.add(id);
      if (v.highlight) {
        v.highlight.nodes.forEach((n) => nodes.add(n));
        v.highlight.edges.forEach((e) => edges.add(e));
      }
      const forceLabels = nb.nodes.size <= MAX_FORCED_LABELS ? nb.nodes : emphasis;
      return { nodes, edges, emphasis, forceLabels };
    }
    if (v.selectedEdge && graph.hasEdge(v.selectedEdge)) {
      const [s, t] = graph.extremities(v.selectedEdge);
      return { nodes: new Set([s, t]), edges: new Set([v.selectedEdge]), emphasis: new Set([s, t]), forceLabels: new Set([s, t]) };
    }
    if (v.highlight) {
      return { nodes: v.highlight.nodes, edges: v.highlight.edges, emphasis: v.highlight.nodes, forceLabels: v.highlight.nodes };
    }
    if (v.selection.size > 0) {
      const nodes = new Set<string>();
      const edges = new Set<string>();
      for (const id of v.selection) {
        if (!graph.hasNode(id)) continue;
        const nb = neighborhoodOf(id);
        nb.nodes.forEach((n) => nodes.add(n));
        nb.edges.forEach((e) => edges.add(e));
      }
      return { nodes, edges, emphasis, forceLabels: emphasis };
    }
    return null;
  };

  const refresh = () => {
    ctxRef.current = computeContext();
    sigmaRef.current?.refresh();
  };

  /* ------------------------------------------------------------------ */
  /* Montagem                                                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const labelFont = getComputedStyle(document.body).fontFamily || "IBM Plex Sans, system-ui, sans-serif";
    const large = graph.size > 2000;

    const nodeReducer: Settings<SigmaNodeAttributes, SigmaEdgeAttributes>["nodeReducer"] = (node, data) => {
      const v = viewRef.current;
      const res: Partial<NodeData> & SigmaNodeAttributes = { ...data };
      if (!v.visibleNodes.has(node)) {
        res.hidden = true;
        return res;
      }
      const ctx = ctxRef.current;
      if (!ctx) return res;
      if (ctx.emphasis.has(node)) {
        res.highlighted = node === hoverRef.current || node === v.selectedNode;
        res.size = data.size * 1.25;
        res.zIndex = 3;
        res.forceLabel = true;
        return res;
      }
      if (ctx.nodes.has(node)) {
        res.zIndex = 2;
        if (ctx.forceLabels.has(node)) res.forceLabel = true;
        return res;
      }
      res.color = DIM.node;
      res.dimmed = true;
      res.zIndex = 0;
      return res;
    };

    const edgeReducer: Settings<SigmaNodeAttributes, SigmaEdgeAttributes>["edgeReducer"] = (edge, data) => {
      const v = viewRef.current;
      const res: Partial<EdgeDisplayData> & SigmaEdgeAttributes = { ...data };
      if (!v.visibleEdges.has(edge)) {
        res.hidden = true;
        return res;
      }
      const ctx = ctxRef.current;
      if (!ctx) return res;
      if (ctx.edges.has(edge)) {
        res.color = data.activeColor;
        res.size = data.size * (edge === v.selectedEdge ? 2.2 : 1.5);
        res.zIndex = 1;
        return res;
      }
      res.color = DIM.edge;
      res.zIndex = 0;
      return res;
    };

    const drawLabel: Settings["defaultDrawNodeLabel"] = (context, data, settings) => {
      if (!data.label) return;
      const size = settings.labelSize;
      context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
      const x = data.x + data.size + 4;
      const y = data.y + size / 3;
      context.lineWidth = 3;
      context.strokeStyle = palette.bg;
      context.lineJoin = "round";
      context.strokeText(data.label, x, y);
      context.fillStyle = (data as NodeData).dimmed ? DIM.nodeLabel : (data as NodeData).highlighted ? palette.fg : palette.fg2;
      context.fillText(data.label, x, y);
    };

    const drawHover: Settings["defaultDrawNodeHover"] = (context, data, settings) => {
      const size = settings.labelSize;
      context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
      const pad = 5;
      if (typeof data.label === "string") {
        const w = context.measureText(data.label).width;
        const x = data.x + data.size + 4;
        const boxX = x - pad;
        const boxY = data.y - size / 2 - pad;
        const boxW = w + pad * 2;
        const boxH = size + pad * 2;
        context.fillStyle = "rgba(17,22,29,0.92)";
        context.strokeStyle = "rgba(35,43,54,1)";
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(boxX, boxY, boxW, boxH, 4);
        context.fill();
        context.stroke();
        context.fillStyle = palette.fg;
        context.fillText(data.label, x, data.y + size / 3);
      }
      // anel sutil em torno do nó
      context.beginPath();
      context.arc(data.x, data.y, data.size + 2.5, 0, Math.PI * 2);
      context.strokeStyle = "rgba(244,246,248,0.55)";
      context.lineWidth = 1.2;
      context.stroke();
    };

    let sigma: NoveloSigma;
    try {
      sigma = new Sigma(graph, container, {
      allowInvalidContainer: true,
      renderEdgeLabels: false,
      enableEdgeEvents: true,
      hideEdgesOnMove: large,
      hideLabelsOnMove: false,
      labelFont,
      labelSize: 12,
      labelWeight: "500",
      labelColor: { color: palette.fg2 },
      labelRenderedSizeThreshold: graph.order > 1000 ? 9 : graph.order > 300 ? 7 : 4,
      labelDensity: 0.08,
      labelGridCellSize: 110,
      defaultDrawNodeLabel: drawLabel,
      defaultDrawNodeHover: drawHover,
      edgeProgramClasses: createEdgeProgramClasses(),
      zIndex: true,
      minEdgeThickness: 0.6,
      antiAliasingFeather: 1,
      stagePadding: 40,
      minCameraRatio: 0.01,
      maxCameraRatio: 4,
      zoomingRatio: 1.5,
      doubleClickZoomingRatio: 1.8,
      nodeReducer,
      edgeReducer,
      });
    } catch (e) {
      setWebglError((e as Error).message || "WebGL indisponível");
      return;
    }
    sigmaRef.current = sigma;
    ctxRef.current = computeContext();
    sigma.refresh();

    sigma.on("enterNode", ({ node }) => {
      hoverRef.current = node;
      container.style.cursor = "pointer";
      refresh();
    });
    sigma.on("leaveNode", () => {
      hoverRef.current = null;
      container.style.cursor = "";
      refresh();
    });
    sigma.on("clickNode", ({ node }) => callbacks.current.onSelectNode(node));
    sigma.on("doubleClickNode", ({ node, preventSigmaDefault }) => {
      preventSigmaDefault();
      callbacks.current.onOpenNode(node);
    });
    sigma.on("clickEdge", ({ edge }) => callbacks.current.onSelectEdge(edge));
    sigma.on("enterEdge", () => (container.style.cursor = "pointer"));
    sigma.on("leaveEdge", () => (container.style.cursor = ""));
    sigma.on("clickStage", () => {
      if (viewRef.current.selectedNode) callbacks.current.onSelectNode(null);
      else if (viewRef.current.selectedEdge) callbacks.current.onSelectEdge(null);
    });

    const ro = new ResizeObserver(() => sigma.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      layoutRef.current?.kill();
      layoutRef.current = null;
      sigma.kill();
      sigmaRef.current = null;
      neighborCache.current = new Map();
    };
    // Sigma é recriado apenas quando o grafo (dataset) muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, palette]);

  /* Atualização de visão (filtros, seleção, realce) → reducers + refresh. */
  useEffect(() => {
    viewRef.current = view;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  /* Voar até um nó. */
  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!sigma || !cameraTarget || !graph.hasNode(cameraTarget.id)) return;
    const data = sigma.getNodeDisplayData(cameraTarget.id);
    if (!data) return;
    const camera = sigma.getCamera();
    const ratio = Math.min(camera.ratio, 0.5);
    void camera.animate({ x: data.x, y: data.y, ratio }, { duration: reducedMotionRef.current ? 0 : 450 });
  }, [cameraTarget, graph]);

  /* Ajustar à tela. */
  useEffect(() => {
    if (!fitToken) return;
    void sigmaRef.current?.getCamera().animatedReset({ duration: reducedMotionRef.current ? 0 : 350 });
  }, [fitToken]);

  /* Reorganizar (FA2 no worker por ~4 s). */
  useEffect(() => {
    if (!layoutToken || graph.order === 0) return;
    if (!layoutRef.current) {
      layoutRef.current = createLayoutRunner(graph, () => callbacks.current.onLayoutRunning?.(false));
    }
    const runner = layoutRef.current;
    if (runner.isRunning()) {
      runner.stop();
      return;
    }
    callbacks.current.onLayoutRunning?.(true);
    runner.run(4000);
  }, [layoutToken, graph]);

  /* Teclado: Escape limpa, +/- zoom, setas movem, "/" foca a busca. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const sigma = sigmaRef.current;
    if (!sigma) return;
    const camera = sigma.getCamera();
    const duration = reducedMotionRef.current ? 0 : 150;
    const pan = (dx: number, dy: number) => {
      const s = camera.getState();
      void camera.animate({ x: s.x + dx * s.ratio * 0.12, y: s.y + dy * s.ratio * 0.12 }, { duration });
    };
    switch (e.key) {
      case "Escape":
        callbacks.current.onEscape();
        break;
      case "+":
      case "=":
        void camera.animatedZoom({ duration });
        break;
      case "-":
      case "_":
        void camera.animatedUnzoom({ duration });
        break;
      case "ArrowLeft":
        pan(-1, 0);
        break;
      case "ArrowRight":
        pan(1, 0);
        break;
      case "ArrowUp":
        pan(0, 1);
        break;
      case "ArrowDown":
        pan(0, -1);
        break;
      case "/":
        callbacks.current.onFocusSearch();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div
      role="application"
      aria-label="Área do grafo. Use as setas para mover, + e - para aproximar, Escape para limpar a seleção e / para buscar."
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="focus-visible:outline-accent absolute inset-0 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
      <div ref={containerRef} role="img" aria-label={ariaLabel} className="h-full w-full" data-testid="graph-canvas" />
      {webglError && (
        <div role="alert" className="bg-bg/90 absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <p className="text-fg font-medium">Este navegador não conseguiu iniciar o WebGL, necessário para o grafo.</p>
            <p className="text-fg-3 mt-1 text-xs">{webglError}</p>
            <a href="/rede" className="text-accent mt-3 inline-block underline underline-offset-4">
              Ver a mesma rede em tabela
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
