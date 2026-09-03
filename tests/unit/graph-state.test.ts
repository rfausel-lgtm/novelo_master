import { describe, expect, it } from "vitest";
import { graphReducer, initialGraphState } from "@/components/graph/useGraphState";

describe("graphReducer", () => {
  it("expande e recolhe o foco até o terceiro grau", () => {
    const initial = initialGraphState();
    const expanded = graphReducer(initial, { type: "focus", root: "pessoa-a", depth: 3 });
    expect(expanded.focus).toEqual({ root: "pessoa-a", depth: 3 });
    const collapsed = graphReducer(expanded, { type: "focus", root: "pessoa-a", depth: 2 });
    expect(collapsed.focus?.depth).toBe(2);
  });

  it("fixa, desafixa e limpa nós fixados", () => {
    const initial = initialGraphState();
    const pinned = graphReducer(initial, { type: "togglePinned", id: "pessoa-a" });
    expect(pinned.pinnedNodes).toEqual(["pessoa-a"]);
    expect(graphReducer(pinned, { type: "togglePinned", id: "pessoa-a" }).pinnedNodes).toEqual([]);
    expect(graphReducer(pinned, { type: "clearPinned" }).pinnedNodes).toEqual([]);
  });
});
