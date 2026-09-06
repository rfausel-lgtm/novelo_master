import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileFilters, filterChips } from "@/components/graph/MobileFilters";
import { defaultFilterState, ALL_NODE_CATEGORIES } from "@/lib/graph/filters";
import { NODE_CATEGORY_LABEL } from "@/lib/graph/types";
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});
afterEach(cleanup);
describe("mobile filter transaction", () => {
  it("does not apply or mutate live filters until the explicit action", () => {
    const filters = defaultFilterState(),
      apply = vi.fn(),
      close = vi.fn();
    render(
      <MobileFilters
        filters={filters}
        count={(f) => f.nodeCategories.size}
        onApply={apply}
        onClose={close}
        ensureEvidenceLayer={async () => {}}
      />,
    );
    fireEvent.click(screen.getByLabelText(NODE_CATEGORY_LABEL.person));
    expect(filters.nodeCategories.has("person")).toBe(true);
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Mostrar 8 resultados/ }));
    expect(apply.mock.calls[0][0].nodeCategories.has("person")).toBe(false);
    expect(apply.mock.calls[0][0].relationshipTypes).toEqual(filters.relationshipTypes);
  });
  it("closing discards the draft and restores body scrolling", () => {
    const filters = defaultFilterState(),
      apply = vi.fn(),
      close = vi.fn();
    const { unmount } = render(
      <MobileFilters
        filters={filters}
        count={(f) => f.nodeCategories.size}
        onApply={apply}
        onClose={close}
        ensureEvidenceLayer={async () => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Desmarcar todos" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar filtros sem aplicar" }));
    expect(close).toHaveBeenCalledOnce();
    expect(apply).not.toHaveBeenCalled();
    expect(filters.nodeCategories.size).toBe(9);
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
  it("waits for evidence data before applying all categories", async () => {
    let finish: () => void = () => {};
    const load = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <MobileFilters
        filters={defaultFilterState()}
        count={(f) => f.nodeCategories.size}
        onApply={vi.fn()}
        onClose={vi.fn()}
        ensureEvidenceLayer={load}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));
    expect(load).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Carregando…" })).toBeDisabled();
    finish();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: `Mostrar ${ALL_NODE_CATEGORIES.length} resultados` }),
      ).toBeEnabled(),
    );
  });
  it("detects category changes even when the set size is unchanged", () => {
    const filters = defaultFilterState();
    filters.nodeCategories.delete("person");
    filters.nodeCategories.add("source");
    expect(filterChips(filters)).toHaveLength(1);
    const restored = { ...filters, ...filterChips(filters)[0].patch };
    expect(restored.nodeCategories).toEqual(defaultFilterState().nodeCategories);
  });
  it("removes a date chip without resetting other filters", () => {
    const filters = { ...defaultFilterState(), dateUntil: "2024-01-01", officialOnly: true };
    const chip = filterChips(filters).find((c) => c.label.startsWith("Até"))!;
    const restored = { ...filters, ...chip.patch };
    expect(restored.dateUntil).toBeUndefined();
    expect(restored.officialOnly).toBe(true);
  });
});
