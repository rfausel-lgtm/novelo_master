import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PanelShell } from "@/components/graph/ui";
import { graphReducer, initialGraphState } from "@/components/graph/useGraphState";

afterEach(cleanup);

describe("painéis mobile", () => {
  it("recolhe e expande sem perder campos preenchidos", () => {
    render(
      <PanelShell title="Conectar pessoas" onClose={vi.fn()}>
        <input aria-label="Origem" defaultValue="" />
      </PanelShell>,
    );
    fireEvent.change(screen.getByLabelText("Origem"), { target: { value: "Banco Master" } });
    fireEvent.click(screen.getByRole("button", { name: "Recolher" }));
    expect(screen.getByRole("button", { name: "Expandir" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "Expandir" }));
    expect(screen.getByLabelText("Origem")).toHaveValue("Banco Master");
  });

  it("fechar cartão conserva seleção, filtros e câmera", () => {
    let state = initialGraphState();
    state = graphReducer(state, { type: "selectNode", id: "banco-master", fly: true });
    state = graphReducer(state, { type: "filters", patch: { officialOnly: true } });
    const closed = graphReducer(state, { type: "panel", panel: null });
    expect(closed.panel).toBeNull();
    expect(closed.selectedNode).toBe("banco-master");
    expect(closed.filters).toBe(state.filters);
    expect(closed.cameraTarget).toBe(state.cameraTarget);
  });
});

describe("foco mobile", () => {
  it("sair do foco preserva recorte, nó selecionado e câmera", () => {
    let state = initialGraphState();
    state = graphReducer(state, { type: "selectNode", id: "banco-master", fly: true });
    state = graphReducer(state, {
      type: "filters",
      patch: { officialOnly: true, dateUntil: "2024-12-31" },
    });
    state = graphReducer(state, { type: "focus", root: "banco-master", depth: 1 });
    const restored = graphReducer(state, { type: "clearFocus" });
    expect(restored.focus).toBeNull();
    expect(restored.filters).toBe(state.filters);
    expect(restored.selectedNode).toBe(state.selectedNode);
    expect(restored.cameraTarget).toBe(state.cameraTarget);
  });

  it("permite à ação da ficha recolher o painel mantendo seu título acessível", () => {
    const change = vi.fn();
    const { rerender } = render(
      <PanelShell
        title="Banco Master"
        onClose={vi.fn()}
        mobileCollapsed={false}
        onMobileCollapsedChange={change}
      >
        Conteúdo
      </PanelShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Recolher" }));
    expect(change).toHaveBeenCalledWith(true);
    rerender(
      <PanelShell
        title="Banco Master"
        onClose={vi.fn()}
        mobileCollapsed
        onMobileCollapsedChange={change}
      >
        Conteúdo
      </PanelShell>,
    );
    expect(screen.getByRole("region", { name: "Banco Master" })).toHaveAttribute(
      "data-collapsed",
      "true",
    );
  });
});
