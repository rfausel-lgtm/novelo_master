"use client";

/**
 * Store único do explorador (useReducer): filtros, seleção, foco, caminho,
 * time machine e painel aberto. Hover fica fora do React (ref no canvas).
 * Sincroniza com a URL: ?n=<nó> ?oficial=1 ?documentado=1 ?ate=YYYY-MM-DD.
 */
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { EvidenceClass } from "@/lib/schema";
import type { PathResult } from "@/lib/graph/algorithms";
import { defaultFilterState, type FilterState } from "@/lib/graph/filters";
import type { NodeCategory } from "@/lib/graph/types";

export type Panel = "node" | "edge" | "filters" | "selection" | "path" | "beforeAfter" | null;

export interface PathState {
  from: string | null;
  to: string | null;
  respectFilters: boolean;
  results: PathResult[];
  active: number;
}

export interface GraphState {
  filters: FilterState;
  selectedNode: string | null;
  selectedEdge: string | null;
  multiSelect: boolean;
  selection: string[];
  focus: { root: string; depth: 1 | 2 | 3 } | null;
  isolate: { withNeighbors: boolean } | null;
  path: PathState;
  panel: Panel;
  playing: boolean;
  /** Token incrementado a cada pedido de "voar até" um nó. */
  cameraTarget: { id: string; token: number } | null;
  pinnedNodes: string[];
}

export type GraphAction =
  | { type: "init"; patch: Partial<GraphState> }
  | { type: "filters"; patch: Partial<FilterState> }
  | { type: "toggleCategory"; category: NodeCategory }
  | { type: "toggleRelationshipType"; relationshipType: string }
  | { type: "toggleEvidenceClass"; evidenceClass: EvidenceClass }
  | { type: "resetFilters" }
  | { type: "selectNode"; id: string | null; fly?: boolean }
  | { type: "selectEdge"; id: string | null }
  | { type: "setMultiSelect"; on: boolean }
  | { type: "addToSelection"; id: string }
  | { type: "removeFromSelection"; id: string }
  | { type: "clearSelection" }
  | { type: "focus"; root: string; depth: 1 | 2 | 3 }
  | { type: "clearFocus" }
  | { type: "isolate"; value: { withNeighbors: boolean } | null }
  | { type: "path"; patch: Partial<PathState> }
  | { type: "panel"; panel: Panel }
  | { type: "playing"; on: boolean }
  | { type: "togglePinned"; id: string }
  | { type: "clearPinned" }
  | { type: "escape" };

export function initialGraphState(): GraphState {
  return {
    filters: defaultFilterState(),
    selectedNode: null,
    selectedEdge: null,
    multiSelect: false,
    selection: [],
    focus: null,
    isolate: null,
    path: { from: null, to: null, respectFilters: true, results: [], active: 0 },
    panel: null,
    playing: false,
    cameraTarget: null,
    pinnedNodes: [],
  };
}

function toggleIn<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function graphReducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case "init":
      return { ...state, ...action.patch };
    case "filters":
      return { ...state, filters: { ...state.filters, ...action.patch } };
    case "toggleCategory":
      return {
        ...state,
        filters: {
          ...state.filters,
          nodeCategories: toggleIn(state.filters.nodeCategories, action.category),
        },
      };
    case "toggleRelationshipType":
      return {
        ...state,
        filters: {
          ...state.filters,
          relationshipTypes: toggleIn(state.filters.relationshipTypes, action.relationshipType),
        },
      };
    case "toggleEvidenceClass":
      return {
        ...state,
        filters: {
          ...state.filters,
          evidenceClasses: toggleIn(state.filters.evidenceClasses, action.evidenceClass),
        },
      };
    case "resetFilters":
      return {
        ...state,
        filters: { ...defaultFilterState(), search: state.filters.search },
        playing: false,
      };
    case "selectNode": {
      if (!action.id)
        return { ...state, selectedNode: null, panel: state.panel === "node" ? null : state.panel };
      const fly = action.fly
        ? { id: action.id, token: (state.cameraTarget?.token ?? 0) + 1 }
        : state.cameraTarget;
      // Em modo caminho, o clique preenche a origem/destino em vez de trocar o painel.
      if (state.panel === "path") {
        const path = !state.path.from
          ? { ...state.path, from: action.id }
          : !state.path.to && action.id !== state.path.from
            ? { ...state.path, to: action.id }
            : { ...state.path, from: action.id, to: null, results: [], active: 0 };
        return { ...state, path, selectedNode: action.id, selectedEdge: null, cameraTarget: fly };
      }
      if (state.multiSelect) {
        const selection = state.selection.includes(action.id)
          ? state.selection
          : [...state.selection, action.id];
        return {
          ...state,
          selection,
          selectedNode: action.id,
          selectedEdge: null,
          panel: "selection",
          cameraTarget: fly,
        };
      }
      return {
        ...state,
        selectedNode: action.id,
        selectedEdge: null,
        panel: "node",
        cameraTarget: fly,
      };
    }
    case "selectEdge":
      if (!action.id)
        return { ...state, selectedEdge: null, panel: state.panel === "edge" ? null : state.panel };
      return { ...state, selectedEdge: action.id, selectedNode: null, panel: "edge" };
    case "setMultiSelect":
      return {
        ...state,
        multiSelect: action.on,
        panel: action.on ? "selection" : state.panel === "selection" ? null : state.panel,
        isolate: action.on ? state.isolate : null,
        selection:
          action.on && state.selectedNode && !state.selection.includes(state.selectedNode)
            ? [...state.selection, state.selectedNode]
            : state.selection,
      };
    case "addToSelection":
      if (state.selection.includes(action.id))
        return { ...state, multiSelect: true, panel: "selection" };
      return {
        ...state,
        multiSelect: true,
        selection: [...state.selection, action.id],
        panel: "selection",
      };
    case "removeFromSelection":
      return { ...state, selection: state.selection.filter((x) => x !== action.id) };
    case "clearSelection":
      return { ...state, selection: [], isolate: null };
    case "focus":
      return { ...state, focus: { root: action.root, depth: action.depth }, isolate: null };
    case "clearFocus":
      return { ...state, focus: null };
    case "isolate":
      return { ...state, isolate: action.value, focus: action.value ? null : state.focus };
    case "path":
      return { ...state, path: { ...state.path, ...action.patch } };
    case "panel":
      return {
        ...state,
        panel: action.panel,
        multiSelect:
          action.panel === "selection" ? true : action.panel === null ? false : state.multiSelect,
      };
    case "playing":
      return { ...state, playing: action.on };
    case "togglePinned":
      return {
        ...state,
        pinnedNodes: state.pinnedNodes.includes(action.id)
          ? state.pinnedNodes.filter((id) => id !== action.id)
          : [...state.pinnedNodes, action.id],
      };
    case "clearPinned":
      return { ...state, pinnedNodes: [] };
    case "escape":
      if (state.playing) return { ...state, playing: false };
      if (state.selectedNode || state.selectedEdge)
        return {
          ...state,
          selectedNode: null,
          selectedEdge: null,
          panel: state.panel === "node" || state.panel === "edge" ? null : state.panel,
        };
      if (state.focus || state.isolate) return { ...state, focus: null, isolate: null };
      if (state.panel) return { ...state, panel: null, multiSelect: false };
      return state;
    default:
      return state;
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Estado + sincronização com a URL (leitura inicial e escrita com debounce). */
export function useGraphState() {
  const [state, dispatch] = useReducer(graphReducer, undefined, initialGraphState);
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const n = searchParams.get("n");
    const e = searchParams.get("e");
    const ate = searchParams.get("ate");
    const patch: Partial<GraphState> = {};
    const filters: Partial<FilterState> = {};
    if (searchParams.get("oficial") === "1") filters.officialOnly = true;
    if (searchParams.get("documentado") === "1") filters.documentedOnly = true;
    if (ate && DATE_RE.test(ate)) filters.dateUntil = ate;
    if (Object.keys(filters).length) patch.filters = { ...defaultFilterState(), ...filters };
    if (e) {
      /* Link direto para uma conexão: o card da aresta é o que o leitor veio ver. */
      patch.selectedEdge = e;
      patch.panel = "edge";
    } else if (n) {
      patch.selectedNode = n;
      patch.panel = "node";
      patch.cameraTarget = { id: n, token: 1 };
    }
    if (Object.keys(patch).length) dispatch({ type: "init", patch });
  }, [searchParams]);

  const { selectedNode, selectedEdge, filters } = state;
  const { officialOnly, documentedOnly, dateUntil } = filters;
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      const set = (k: string, v: string | null) =>
        v ? url.searchParams.set(k, v) : url.searchParams.delete(k);
      set("n", selectedNode);
      set("e", selectedEdge);
      set("oficial", officialOnly ? "1" : null);
      set("documentado", documentedOnly ? "1" : null);
      set("ate", dateUntil ?? null);
      const next = url.pathname + (url.search ? url.search : "") + url.hash;
      const cur = window.location.pathname + window.location.search + window.location.hash;
      if (next !== cur) window.history.replaceState(window.history.state, "", next);
    }, 200);
    return () => clearTimeout(t);
  }, [selectedNode, selectedEdge, officialOnly, documentedOnly, dateUntil]);

  const dataset = searchParams.get("dataset");
  const selectNode = useCallback(
    (id: string | null, fly = false) => dispatch({ type: "selectNode", id, fly }),
    [],
  );

  return { state, dispatch, selectNode, dataset };
}
