import { test, expect } from "@playwright/test";

test.describe("Grafo (dataset sintético de demonstração)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/grafo?dataset=demo");
    await expect(page.getByTestId("graph-canvas")).toBeVisible({ timeout: 20_000 });
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
    const before = await page
      .getByText(/\d+ nós · \d+ arestas/)
      .first()
      .innerText();
    await page.getByRole("button", { name: "Filtros" }).click();
    await page.getByRole("button", { name: "MOSTRAR APENAS FONTES OFICIAIS" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "APENAS FONTES OFICIAIS" }),
    ).toBeVisible();
    const after = await page
      .getByText(/\d+ nós · \d+ arestas/)
      .first()
      .innerText();
    expect(after).not.toEqual(before);
  });

  test("time machine altera a data limite e a contagem", async ({ page }) => {
    const slider = page.getByRole("slider", { name: /Data limite/i });
    const before = await page
      .getByText(/\d+ nós · \d+ arestas/)
      .first()
      .innerText();
    const max = Number(await slider.getAttribute("max"));
    await slider.fill(String(Math.floor(max / 3)));
    await expect(page.getByText(/^Até/)).not.toContainText("2026");
    const after = await page
      .getByText(/\d+ nós · \d+ arestas/)
      .first()
      .innerText();
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

  test("permite expandir, fixar, girar e controlar a física", async ({ page }) => {
    const search = page.getByRole("combobox", { name: /Buscar pessoa/i });
    await search.fill("Pessoa Exemplo 2");
    await page.getByRole("option").first().click();

    await expect(page.getByRole("button", { name: /Expandir para o terceiro grau/ })).toContainText(
      /\+\d+/,
    );
    await page.getByRole("button", { name: /Expandir para o terceiro grau/ }).click();
    await page.getByRole("button", { name: "Fixar nó no layout" }).click();
    await expect(page.getByRole("button", { name: "Desafixar nó" })).toBeVisible();

    await page.getByRole("button", { name: "Girar o grafo para a direita" }).click();
    await page.getByRole("button", { name: "Remover a rotação do grafo" }).click();

    const physics = page.getByRole("button", { name: "Reorganizar o layout" });
    await physics.click();
    await expect(physics).toContainText("Pausar física");
    await physics.click();
    await expect(physics).toContainText("Ativar física");
  });
});

test.describe("Stress do grafo (execução agendada/manual)", () => {
  test("carrega e mantém as interações essenciais em 5.000/25.000", async ({ page }) => {
    test.skip(
      process.env.NOVELO_STRESS !== "1",
      "Executado apenas pelo job agendado/manual de stress.",
    );
    test.setTimeout(90_000);
    await page.goto("/grafo?dataset=stress");
    const canvas = page.getByTestId("graph-canvas");
    await expect(canvas).toBeVisible({ timeout: 45_000 });
    await expect(canvas).toHaveAttribute("aria-label", /5\.000 nós|5000 nós/, { timeout: 45_000 });

    const search = page.getByRole("combobox", { name: /Buscar pessoa/i });
    await search.fill("Pessoa Exemplo 2");
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.getByRole("option").first().click();
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();

    await page.getByRole("button", { name: "Filtros" }).click();
    await page.getByRole("button", { name: "MOSTRAR SOMENTE FATOS DOCUMENTADOS" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "SOMENTE FATOS DOCUMENTADOS" }),
    ).toBeVisible();

    const physics = page.getByRole("button", { name: "Reorganizar o layout" });
    await physics.click();
    await expect(physics).toContainText("Pausar física");
    await physics.click();
  });
});
