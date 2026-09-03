import { test, expect } from "@playwright/test";

test.describe("Grafo (dataset sintético de demonstração)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/grafo?dataset=demo");
    await expect(page.getByTestId("graph-canvas")).toBeVisible();
    await expect(page.getByText(/\d+ nós · \d+ arestas/)).toBeVisible({ timeout: 20_000 });
  });

  test("carrega, busca um nó, abre o card e leva ao dossiê", async ({ page }) => {
    const search = page.getByRole("combobox", { name: /Buscar pessoa/i });
    await search.fill("Pessoa Exemplo 2");
    const option = page.getByRole("option").first();
    await expect(option).toBeVisible();
    await option.click();
    await expect(page.getByRole("heading", { name: /Pessoa Exemplo 2/ })).toBeVisible();
    await expect(page.getByText("Por que está no Novelo?")).toBeVisible();
    const dossier = page.getByRole("link", { name: /Abrir dossiê completo/i });
    await expect(dossier).toHaveAttribute("href", /\/pessoas\//);
  });

  test("modo somente fontes oficiais exibe banner e reduz a contagem", async ({ page }) => {
    const before = await page.getByText(/\d+ nós · \d+ arestas/).first().innerText();
    await page.getByRole("button", { name: "Filtros" }).click();
    await page.getByRole("button", { name: "MOSTRAR APENAS FONTES OFICIAIS" }).click();
    await expect(page.getByRole("status").filter({ hasText: "APENAS FONTES OFICIAIS" })).toBeVisible();
    const after = await page.getByText(/\d+ nós · \d+ arestas/).first().innerText();
    expect(after).not.toEqual(before);
  });

  test("time machine altera a data limite e a contagem", async ({ page }) => {
    const slider = page.getByRole("slider", { name: /Data limite/i });
    const before = await page.getByText(/\d+ nós · \d+ arestas/).first().innerText();
    await slider.focus();
    for (let i = 0; i < 400; i++) await page.keyboard.press("ArrowLeft");
    await expect(page.getByText(/^Até/)).not.toContainText("2026");
    const after = await page.getByText(/\d+ nós · \d+ arestas/).first().innerText();
    expect(after).not.toEqual(before);
  });

  test("caminho entre dois nós é calculado", async ({ page }) => {
    await page.getByRole("button", { name: "Como A se conecta a B?" }).click();
    await page.getByRole("combobox", { name: "Nó de origem" }).fill("Pessoa Exemplo 2");
    await page.getByRole("option").first().click();
    await page.getByRole("combobox", { name: "Nó de destino" }).fill("Pessoa Exemplo 11");
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Buscar caminho" }).click();
    await expect(page.getByText(/Caminho mínimo|Não há caminho/)).toBeVisible();
  });

  test("legenda explica cor e forma", async ({ page }) => {
    await page.getByRole("button", { name: "Legenda" }).click();
    await expect(page.getByRole("heading", { name: "Força da evidência" })).toBeVisible();
    await expect(page.getByText(/Vermelho nunca significa ilícito/)).toBeVisible();
  });
});
