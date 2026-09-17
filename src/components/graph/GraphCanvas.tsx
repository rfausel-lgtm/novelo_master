"use client";
import { MOBILE_QUERY } from "@/lib/graph/mobile";

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
import { arestaMaisProxima, type SegmentoDeAresta } from "@/lib/graph/hit";
import { type Palette } from "@/lib/graph/style";

export interface CanvasView {
  visibleNodes: ReadonlySet<string>;
  visibleEdges: ReadonlySet<string>;
  selectedNode: string | null;
  selectedEdge: string | null;
  selection: ReadonlySet<string>;
  highlight: { nodes: ReadonlySet<string>; edges: ReadonlySet<string> } | null;
  pinnedNodes: ReadonlySet<string>;
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
  restoreToken: number;
  cameraCommand: {
    token: number;
    action: "zoom-in" | "zoom-out";
  } | null;
  organizeMode: boolean;
  reducedMotion: boolean;
  ariaLabel: string;
}

interface Context {
  nodes: ReadonlySet<string>;
  edges: ReadonlySet<string>;
  emphasis: ReadonlySet<string>;
  forceLabels: ReadonlySet<string>;
  /** O foco vem de um nó selecionado (não de hover): as linhas dele engrossam mais. */
  fromSelection: boolean;
}

type NodeData = NodeDisplayData & { dimmed?: boolean };
type NoveloSigma = Sigma<SigmaNodeAttributes, SigmaEdgeAttributes>;

const MAX_FORCED_LABELS = 40;
/* Alcance da mira sobre as linhas, em px de tela: o dedo cobre bem mais que o ponteiro. */
const EDGE_HIT_MOUSE_PX = 8;
const EDGE_HIT_TOUCH_PX = 18;

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
    restoreToken,
    cameraCommand,
    reducedMotion,
    organizeMode,
    ariaLabel,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<NoveloSigma | null>(null);
  const viewRef = useRef(view);
  /* A paleta muda com o tema; num ref, as rotinas de desenho a leem sem recriar o Sigma. */
  const paletteRef = useRef(palette);
  const hoverRef = useRef<string | null>(null);
  /* Aresta ao alcance do mouse: engrossa, ganha rótulo junto ao cursor e é o alvo do clique. */
  const edgeHoverRef = useRef<string | null>(null);
  /* Aresta que o próprio Sigma acusa sob o ponteiro; vence a geometria, como no clique. */
  const nativeEdgeRef = useRef<string | null>(null);
  const [edgeTip, setEdgeTip] = useState<{
    text: string;
    x: number;
    y: number;
    left: boolean;
  } | null>(null);
  const ctxRef = useRef<Context | null>(null);
  const neighborCache = useRef(new Map<string, { nodes: Set<string>; edges: Set<string> }>());
  const layoutRef = useRef<LayoutRunner | null>(null);
  const initialPositionsRef = useRef(new Map<string, { x: number; y: number }>());
  const draggedNodeRef = useRef<string | null>(null);
  const dragMovedRef = useRef(false);
  const lastDragAtRef = useRef(0);
  const callbacks = useRef({
    onSelectNode,
    onSelectEdge,
    onOpenNode,
    onEscape,
    onFocusSearch,
    onLayoutRunning,
  });
  const reducedMotionRef = useRef(reducedMotion);
  const organizeRef = useRef(organizeMode);
  const [webglError, setWebglError] = useState<string | null>(null);
  useEffect(() => {
    callbacks.current = {
      onSelectNode,
      onSelectEdge,
      onOpenNode,
      onEscape,
      onFocusSearch,
      onLayoutRunning,
    };
    reducedMotionRef.current = reducedMotion;
    organizeRef.current = organizeMode;
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
      return { nodes, edges, emphasis, forceLabels, fromSelection: !hover };
    }
    if (v.selectedEdge && graph.hasEdge(v.selectedEdge)) {
      const [s, t] = graph.extremities(v.selectedEdge);
      return {
        nodes: new Set([s, t]),
        edges: new Set([v.selectedEdge]),
        emphasis: new Set([s, t]),
        forceLabels: new Set([s, t]),
        fromSelection: false,
      };
    }
    if (v.highlight) {
      return {
        nodes: v.highlight.nodes,
        edges: v.highlight.edges,
        emphasis: v.highlight.nodes,
        forceLabels: v.highlight.nodes,
        fromSelection: false,
      };
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
      return { nodes, edges, emphasis, forceLabels: emphasis, fromSelection: false };
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

    const labelFont =
      getComputedStyle(document.body).fontFamily || "IBM Plex Sans, system-ui, sans-serif";
    const large = graph.size > 2000;
    /* Em tela estreita o rótulo ocupa proporção muito maior: menos rótulos e menos moldura. */
    const narrow = window.matchMedia(MOBILE_QUERY).matches;

    const nodeReducer: Settings<SigmaNodeAttributes, SigmaEdgeAttributes>["nodeReducer"] = (
      node,
      data,
    ) => {
      const v = viewRef.current;
      const res: Partial<NodeData> & SigmaNodeAttributes = { ...data };
      if (!v.visibleNodes.has(node)) {
        res.hidden = true;
        return res;
      }
      if (v.pinnedNodes.has(node)) {
        res.forceLabel = true;
        res.zIndex = 2;
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
      res.color = paletteRef.current.dimNode;
      res.dimmed = true;
      res.zIndex = 0;
      return res;
    };

    const edgeReducer: Settings<SigmaNodeAttributes, SigmaEdgeAttributes>["edgeReducer"] = (
      edge,
      data,
    ) => {
      const v = viewRef.current;
      const res: Partial<EdgeDisplayData> & SigmaEdgeAttributes = { ...data };
      if (!v.visibleEdges.has(edge)) {
        res.hidden = true;
        return res;
      }
      const ctx = ctxRef.current;
      const hovered = edge === edgeHoverRef.current;
      /* Escalas sobre a espessura da classe: a proporção entre D, C, A e I se mantém. */
      if (ctx?.edges.has(edge)) {
        res.color = data.activeColor;
        let scale = edge === v.selectedEdge ? 3.2 : ctx.fromSelection ? 2.5 : 1.5;
        if (hovered) scale = Math.max(scale, ctx.fromSelection ? 3.2 : 2.2);
        res.size = data.size * scale;
        res.zIndex = hovered ? 2 : 1;
        return res;
      }
      if (hovered) {
        res.color = data.activeColor;
        res.size = data.size * 2.2;
        res.zIndex = 2;
        return res;
      }
      if (!ctx) return res;
      res.color = paletteRef.current.dimEdge;
      res.zIndex = 0;
      return res;
    };

    /*
     * Rótulo à direita do nó, como padrão. Perto da borda direita ele seria cortado
     * pela lateral do canvas — nesse caso desenha à esquerda, sem sair da tela.
     */
    const xRotulo = (
      context: CanvasRenderingContext2D,
      node: { x: number; size: number },
      texto: number,
      margem: number,
    ) => {
      const largura = context.canvas.width / (window.devicePixelRatio || 1);
      const direita = node.x + node.size + 4;
      if (direita + texto <= largura - margem) return direita;
      /* Nó colado na borda (ou logo fora dela): mantém o rótulo inteiro dentro do palco. */
      const esquerda = node.x - node.size - 4 - texto;
      return Math.min(Math.max(margem, esquerda), largura - margem - texto);
    };

    const drawLabel: Settings["defaultDrawNodeLabel"] = (context, data, settings) => {
      if (!data.label) return;
      const graphKind = (data as NodeData & { kind?: string }).kind;
      const longo =
        graphKind === "event" ||
        graphKind === "public_act" ||
        graphKind === "claim" ||
        graphKind === "evidence";
      const max = narrow ? (longo ? 22 : 26) : longo ? 42 : 54;
      const label =
        data.label.length > max ? `${data.label.slice(0, max - 1).trimEnd()}…` : data.label;
      const size = settings.labelSize;
      context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
      const x = xRotulo(context, data, context.measureText(label).width, 4);
      const y = data.y + size / 3;
      context.lineWidth = 3;
      context.strokeStyle = paletteRef.current.bg;
      context.lineJoin = "round";
      context.strokeText(label, x, y);
      context.fillStyle = (data as NodeData).dimmed
        ? paletteRef.current.dimNodeLabel
        : (data as NodeData).highlighted
          ? paletteRef.current.fg
          : paletteRef.current.fg2;
      context.fillText(label, x, y);
    };

    const drawHover: Settings["defaultDrawNodeHover"] = (context, data, settings) => {
      const size = settings.labelSize;
      context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
      const pad = 5;
      if (typeof data.label === "string") {
        const w = context.measureText(data.label).width;
        const x = xRotulo(context, data, w, pad + 4);
        const boxX = x - pad;
        const boxY = data.y - size / 2 - pad;
        const boxW = w + pad * 2;
        const boxH = size + pad * 2;
        context.fillStyle = paletteRef.current.hoverBg;
        context.strokeStyle = paletteRef.current.hoverBorder;
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(boxX, boxY, boxW, boxH, 4);
        context.fill();
        context.stroke();
        context.fillStyle = paletteRef.current.fg;
        context.fillText(data.label, x, data.y + size / 3);
      }
      // anel sutil em torno do nó
      context.beginPath();
      context.arc(data.x, data.y, data.size + 2.5, 0, Math.PI * 2);
      context.strokeStyle = paletteRef.current.hoverRing;
      context.lineWidth = 1.2;
      context.stroke();
    };

    let sigma: NoveloSigma;
    try {
      sigma = new Sigma(graph, container, {
        allowInvalidContainer: true,
        renderEdgeLabels: false,
        enableEdgeEvents: true,
        enableCameraRotation: false,
        hideEdgesOnMove: large,
        hideLabelsOnMove: false,
        labelFont,
        labelSize: narrow ? 11 : 12,
        labelWeight: "500",
        labelColor: { color: paletteRef.current.fg2 },
        labelRenderedSizeThreshold: narrow
          ? 7.5
          : graph.order > 1000
            ? 9
            : graph.order > 300
              ? 7
              : 4,
        labelDensity: narrow ? 0.03 : 0.045,
        labelGridCellSize: narrow ? 165 : 145,
        defaultDrawNodeLabel: drawLabel,
        defaultDrawNodeHover: drawHover,
        edgeProgramClasses: createEdgeProgramClasses(),
        zIndex: true,
        minEdgeThickness: 0.6,
        antiAliasingFeather: 1,
        stagePadding: narrow ? 14 : 40,
        minCameraRatio: 0.01,
        maxCameraRatio: 4,
        zoomingRatio: 1.5,
        doubleClickZoomingRatio: 1.8,
        nodeReducer,
        edgeReducer,
      });
    } catch (e) {
      const message = (e as Error).message || "WebGL indisponível";
      queueMicrotask(() => setWebglError(message));
      return;
    }
    sigmaRef.current = sigma;
    initialPositionsRef.current = new Map(
      graph
        .nodes()
        .map((id) => [
          id,
          { x: graph.getNodeAttribute(id, "x"), y: graph.getNodeAttribute(id, "y") },
        ]),
    );
    ctxRef.current = computeContext();
    sigma.refresh();

    /*
     * Mira com tolerância. A detecção nativa de aresta lê um framebuffer em meia resolução e
     * quase nunca acerta uma linha de 1 px; como as arestas são retas, a distância ao segmento
     * em pixels de tela resolve. Só entram arestas visíveis com as duas pontas visíveis, e as do
     * contexto em foco têm prioridade dentro do alcance.
     */
    function* segmentosNaTela(): Generator<SegmentoDeAresta> {
      const v = viewRef.current;
      const ctx = ctxRef.current;
      const telas = new Map<string, { x: number; y: number } | null>();
      const naTela = (node: string) => {
        if (!telas.has(node)) {
          const data = sigma.getNodeDisplayData(node);
          /* Coordenadas enquadradas → viewport: já considera zoom e deslocamento. */
          telas.set(node, data && !data.hidden ? sigma.framedGraphToViewport(data) : null);
        }
        return telas.get(node) ?? null;
      };
      for (const edge of v.visibleEdges) {
        if (!graph.hasEdge(edge)) continue;
        const [s, t] = graph.extremities(edge);
        if (!v.visibleNodes.has(s) || !v.visibleNodes.has(t)) continue;
        const a = naTela(s);
        const b = naTela(t);
        if (!a || !b) continue;
        yield { id: edge, a, b, prioridade: ctx?.edges.has(edge) ?? false };
      }
    }
    const arestaPerto = (x: number, y: number, tolerancia: number) =>
      arestaMaisProxima({ x, y }, segmentosNaTela(), tolerancia);

    /* Aviso de hover: só com mouse. O rótulo junto ao cursor diz o que o clique vai abrir. */
    const setEdgeHover = (edge: string | null, x = 0, y = 0) => {
      const previous = edgeHoverRef.current;
      if (edge !== previous) {
        edgeHoverRef.current = edge;
        if (!hoverRef.current) container.style.cursor = edge ? "pointer" : "";
        const changed = [previous, edge].filter((e): e is string => !!e && graph.hasEdge(e));
        if (changed.length) sigma.refresh({ partialGraph: { edges: changed } });
      }
      if (!edge) return setEdgeTip(null);
      const attrs = graph.getEdgeAttributes(edge);
      const classe = `classe ${attrs.evidence_class}`;
      setEdgeTip({
        text: attrs.label ? `${attrs.label} · ${classe}` : classe,
        x,
        y,
        left: x > container.clientWidth * 0.6,
      });
    };
    let hoverFrame = 0;
    let hoverPoint: { x: number; y: number } | null = null;
    const scheduleEdgeHover = (x: number, y: number) => {
      hoverPoint = { x, y };
      if (hoverFrame) return;
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        const p = hoverPoint;
        if (!p) return;
        if (hoverRef.current || draggedNodeRef.current) return setEdgeHover(null);
        setEdgeHover(nativeEdgeRef.current ?? arestaPerto(p.x, p.y, EDGE_HIT_MOUSE_PX), p.x, p.y);
      });
    };
    const clearEdgeHover = () => {
      hoverPoint = null;
      if (hoverFrame) cancelAnimationFrame(hoverFrame);
      hoverFrame = 0;
      setEdgeHover(null);
    };

    sigma.on("enterNode", ({ node }) => {
      clearEdgeHover();
      hoverRef.current = node;
      container.style.cursor = "pointer";
      refresh();
    });
    sigma.on("leaveNode", () => {
      hoverRef.current = null;
      container.style.cursor = "";
      refresh();
    });
    sigma.on("clickNode", ({ node }) => {
      if (Date.now() - lastDragAtRef.current < 180) return;
      callbacks.current.onSelectNode(node);
    });
    sigma.on("downNode", ({ node, event, preventSigmaDefault }) => {
      const touch = "touches" in event.original;
      if ((touch || window.matchMedia(MOBILE_QUERY).matches) && !organizeRef.current) return;
      if (touch && (event.original as TouchEvent).touches.length !== 1) return;
      draggedNodeRef.current = node;
      dragMovedRef.current = false;
      layoutRef.current?.stop();
      graph.setNodeAttribute(node, "fixed", true);
      /*
       * Congela o enquadramento durante o arraste. Sem isso, mover um nó altera o
       * bounding box, que altera a conversão tela→grafo, que move o nó de novo:
       * a realimentação estoura as coordenadas e apaga o mapa inteiro.
       */
      if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
      preventSigmaDefault();
    });
    const moveDraggedNode = (x: number, y: number) => {
      const node = draggedNodeRef.current;
      if (!node) return;
      const position = sigma.viewportToGraph({ x, y });
      if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return;
      graph.mergeNodeAttributes(node, { x: position.x, y: position.y });
      dragMovedRef.current = true;
      sigma.refresh({ partialGraph: { nodes: [node] }, skipIndexation: false });
    };
    sigma.getMouseCaptor().on("mousemovebody", (e) => {
      if (!draggedNodeRef.current) return;
      moveDraggedNode(e.x, e.y);
      e.preventSigmaDefault();
      e.original.preventDefault();
      e.original.stopPropagation();
    });
    sigma.getMouseCaptor().on("mouseup", () => {
      if (dragMovedRef.current) lastDragAtRef.current = Date.now();
      const node = draggedNodeRef.current;
      if (node && !viewRef.current.pinnedNodes.has(node))
        graph.setNodeAttribute(node, "fixed", false);
      draggedNodeRef.current = null;
    });
    sigma.getTouchCaptor().on("touchmove", (e) => {
      if (e.touches.length !== 1) {
        const node = draggedNodeRef.current;
        if (node && !viewRef.current.pinnedNodes.has(node))
          graph.setNodeAttribute(node, "fixed", false);
        draggedNodeRef.current = null;
        lastDragAtRef.current = Date.now();
        return;
      }
      if (!draggedNodeRef.current || !e.touches[0]) return;
      moveDraggedNode(e.touches[0].x, e.touches[0].y);
      e.preventSigmaDefault();
      e.original.preventDefault();
    });
    sigma.getTouchCaptor().on("touchup", () => {
      if (dragMovedRef.current) lastDragAtRef.current = Date.now();
      const node = draggedNodeRef.current;
      if (node && !viewRef.current.pinnedNodes.has(node))
        graph.setNodeAttribute(node, "fixed", false);
      draggedNodeRef.current = null;
    });
    sigma.on("doubleClickNode", ({ node, preventSigmaDefault }) => {
      preventSigmaDefault();
      callbacks.current.onOpenNode(node);
    });
    sigma.on("clickEdge", ({ edge }) => callbacks.current.onSelectEdge(edge));
    /* Os eventos nativos de aresta alimentam o mesmo estado do hover com tolerância. */
    sigma.on("enterEdge", ({ edge, event }) => {
      if ("touches" in event.original) return;
      nativeEdgeRef.current = edge;
      scheduleEdgeHover(event.x, event.y);
    });
    sigma.on("leaveEdge", ({ event }) => {
      nativeEdgeRef.current = null;
      if ("touches" in event.original) return;
      scheduleEdgeHover(event.x, event.y);
    });
    sigma.on("moveBody", ({ event }) => {
      const original = event.original;
      if ("touches" in original) return;
      /* O movimento chega do documento inteiro: sobre um painel, ou arrastando, não há aviso. */
      if (
        !(original.target instanceof Node && container.contains(original.target)) ||
        original.buttons !== 0 ||
        draggedNodeRef.current
      )
        return clearEdgeHover();
      scheduleEdgeHover(event.x, event.y);
    });
    sigma.on("leaveStage", clearEdgeHover);
    /* Zoom e pan tiram a linha do lugar: o rótulo sai junto. */
    sigma.getCamera().on("updated", clearEdgeHover);
    sigma.on("clickStage", ({ event }) => {
      /* Nem nó nem aresta sob o ponto: antes de desselecionar, procura a linha ao alcance. */
      const touch = "touches" in event.original;
      const edge = arestaPerto(event.x, event.y, touch ? EDGE_HIT_TOUCH_PX : EDGE_HIT_MOUSE_PX);
      if (edge && Date.now() - lastDragAtRef.current >= 180) {
        callbacks.current.onSelectEdge(edge);
        return;
      }
      if (viewRef.current.selectedNode) callbacks.current.onSelectNode(null);
      else if (viewRef.current.selectedEdge) callbacks.current.onSelectEdge(null);
    });

    const ro = new ResizeObserver(() => sigma.resize());
    ro.observe(container);

    return () => {
      if (hoverFrame) cancelAnimationFrame(hoverFrame);
      ro.disconnect();
      layoutRef.current?.kill();
      layoutRef.current = null;
      sigma.kill();
      sigmaRef.current = null;
      neighborCache.current = new Map();
    };
    // Sigma é recriado apenas quando o grafo (dataset) muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  /* Troca de tema: só repinta o que já está na tela. */
  useEffect(() => {
    paletteRef.current = palette;
    sigmaRef.current?.setSetting("labelColor", { color: palette.fg2 });
    sigmaRef.current?.refresh({ skipIndexation: true });
  }, [palette]);

  /* Atualização de visão (filtros, seleção, realce) → reducers + refresh. */
  useEffect(() => {
    viewRef.current = view;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  /* Aplica só a diferença: percorrer todos os nós a cada seleção trava o dataset de estresse. */
  const appliedPinsRef = useRef<ReadonlySet<string>>(new Set());
  useEffect(() => {
    const applied = appliedPinsRef.current;
    for (const id of applied) {
      if (!view.pinnedNodes.has(id) && graph.hasNode(id))
        graph.setNodeAttribute(id, "fixed", false);
    }
    for (const id of view.pinnedNodes) {
      if (!applied.has(id) && graph.hasNode(id)) graph.setNodeAttribute(id, "fixed", true);
    }
    appliedPinsRef.current = view.pinnedNodes;
  }, [graph, view.pinnedNodes]);

  /* Voar até um nó. */
  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!sigma || !cameraTarget || !graph.hasNode(cameraTarget.id)) return;
    const data = sigma.getNodeDisplayData(cameraTarget.id);
    if (!data) return;
    const camera = sigma.getCamera();
    const ratio = Math.min(camera.ratio, 0.5);
    // Mobile reserva linhas reais para as barras e o cartão; não há oclusão do canvas.
    sigma.resize();
    const container = sigma.getContainer();
    const bounds = container.getBoundingClientRect();
    const workspace = container.closest("[data-testid='graph-explorer']");
    const desktop = !window.matchMedia(MOBILE_QUERY).matches;
    const panelBounds = desktop
      ? workspace?.querySelector(".graph-panel")?.getBoundingClientRect()
      : null;
    const freeRight = panelBounds
      ? Math.max(80, panelBounds.left - bounds.left - 12)
      : bounds.width;
    const target = { x: freeRight / 2, y: bounds.height / 2 };
    const cameraState = { ...camera.getState(), x: data.x, y: data.y, ratio };
    const point = sigma.viewportToFramedGraph(target, { cameraState });
    void camera.animate(
      { x: data.x + data.x - point.x, y: data.y + data.y - point.y, ratio },
      { duration: reducedMotionRef.current ? 0 : 450 },
    );
  }, [cameraTarget, graph]);

  /* Ajustar à tela. */
  useEffect(() => {
    if (!fitToken) return;
    const sigma = sigmaRef.current;
    if (!sigma) return;
    sigma.resize();
    const nodes = [...viewRef.current.visibleNodes]
      .map((id) => sigma.getNodeDisplayData(id))
      .filter((n): n is NodeDisplayData => !!n);
    if (!nodes.length) return;
    const camera = sigma.getCamera();
    const baseState = { x: 0.5, y: 0.5, angle: 0, ratio: 1 };
    const points = nodes.map((n) => sigma.framedGraphToViewport(n, { cameraState: baseState }));
    const xs = points.map((p) => p.x),
      ys = points.map((p) => p.y);
    const rect = sigma.getContainer().getBoundingClientRect();
    const workspace = sigma.getContainer().closest("[data-testid='graph-explorer']");
    const desktop = !window.matchMedia(MOBILE_QUERY).matches;
    const panel = desktop
      ? workspace?.querySelector(".graph-panel")?.getBoundingClientRect()
      : null;
    const toolbar = desktop
      ? workspace?.querySelector(".graph-toolbar")?.getBoundingClientRect()
      : null;
    const timeline = desktop
      ? workspace?.querySelector(".graph-timeline")?.getBoundingClientRect()
      : null;
    const left = 24,
      top = toolbar ? toolbar.bottom - rect.top + 16 : 24;
    const right = panel ? panel.left - rect.left - 16 : rect.width - 24;
    const bottom = timeline ? timeline.top - rect.top - 16 : rect.height - 64;
    const ratio = Math.min(
      4,
      Math.max(
        0.01,
        (Math.max(...xs) - Math.min(...xs)) / Math.max(40, right - left),
        (Math.max(...ys) - Math.min(...ys)) / Math.max(40, bottom - top),
      ),
    );
    const center = sigma.viewportToFramedGraph(
      { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 },
      { cameraState: baseState },
    );
    const target = sigma.viewportToFramedGraph(
      { x: (left + right) / 2, y: (top + bottom) / 2 },
      { cameraState: { ...baseState, ...center, ratio } },
    );
    void camera.animate(
      { x: 2 * center.x - target.x, y: 2 * center.y - target.y, ratio },
      { duration: reducedMotionRef.current ? 0 : 350 },
    );
  }, [fitToken]);

  /* Restaurar posições editoriais pré-calculadas. */
  useEffect(() => {
    if (!restoreToken) return;
    layoutRef.current?.stop();
    for (const [id, position] of initialPositionsRef.current) {
      if (graph.hasNode(id)) graph.mergeNodeAttributes(id, position);
    }
    /* Volta ao enquadramento automático: o congelamento só vale enquanto há arraste. */
    sigmaRef.current?.setCustomBBox(null);
    sigmaRef.current?.refresh();
    void sigmaRef.current
      ?.getCamera()
      .animatedReset({ duration: reducedMotionRef.current ? 0 : 350 });
  }, [restoreToken, graph]);

  /* Zoom pelos botões da barra. */
  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!sigma || !cameraCommand) return;
    const camera = sigma.getCamera();
    const options = { duration: reducedMotionRef.current ? 0 : 180 };
    if (cameraCommand.action === "zoom-in") void camera.animatedZoom(options);
    else void camera.animatedUnzoom(options);
  }, [cameraCommand]);

  /* Física contínua no worker; segundo clique pausa. */
  useEffect(() => {
    if (!layoutToken || graph.order === 0) return;
    if (!layoutRef.current) {
      layoutRef.current = createLayoutRunner(graph, () =>
        callbacks.current.onLayoutRunning?.(false),
      );
    }
    const runner = layoutRef.current;
    if (runner.isRunning()) {
      runner.stop();
      return;
    }
    callbacks.current.onLayoutRunning?.(true);
    runner.run(reducedMotionRef.current ? 1200 : undefined);
  }, [layoutToken, graph]);

  /* Teclado: Escape limpa, +/- zoom, setas movem, "/" foca a busca. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const sigma = sigmaRef.current;
    if (!sigma) return;
    const camera = sigma.getCamera();
    const duration = reducedMotionRef.current ? 0 : 150;
    const pan = (dx: number, dy: number) => {
      const s = camera.getState();
      void camera.animate(
        { x: s.x + dx * s.ratio * 0.12, y: s.y + dy * s.ratio * 0.12 },
        { duration },
      );
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
      aria-label="Área do grafo. No celular, um dedo move o mapa e um toque seleciona. Ative Mover nós em Ferramentas para reorganizar. Use as setas para mover, + e - para aproximar, Escape para limpar e / para buscar."
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="focus-visible:outline-accent absolute inset-0 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
      <div
        ref={containerRef}
        role="img"
        aria-label={ariaLabel}
        className="h-full w-full"
        data-testid="graph-canvas"
      />
      {edgeTip && (
        /* Repete o que o card da conexão diz em texto; para leitor de tela, o card basta. */
        <div
          aria-hidden="true"
          data-testid="edge-hover-label"
          className="text-fg pointer-events-none absolute z-10 max-w-[min(20rem,70%)] truncate rounded border px-2 py-1 text-xs shadow-sm"
          style={{
            left: edgeTip.x,
            top: edgeTip.y,
            transform: edgeTip.left
              ? "translate(calc(-100% - 12px), 14px)"
              : "translate(12px, 14px)",
            background: "var(--canvas-hover-bg)",
            borderColor: "var(--canvas-hover-border)",
          }}
        >
          {edgeTip.text}
        </div>
      )}
      {webglError && (
        <div
          role="alert"
          className="bg-bg/90 absolute inset-0 flex items-center justify-center p-6 text-center"
        >
          <div className="max-w-md">
            <p className="text-fg font-medium">
              Este navegador não conseguiu iniciar o WebGL, necessário para o grafo.
            </p>
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
