import { test, expect, type Page } from "@playwright/test";

/** As ações secundárias do card de nó ficam atrás de "Mais ações". */
async function abrirMaisAcoes(page: Page) {
  const resumo = page.getByText("Mais ações", { exact: true });
  if (!(await resumo.isVisible())) return;
  /* Idempotente: o <summary> continua visível depois de aberto, e clicar de novo fecharia. */
  const bloco = page.locator("details", { has: resumo });
  if (await bloco.evaluate((el) => (el as HTMLDetailsElement).open)) return;
  await resumo.click();
}

/** No mobile as ferramentas secundárias ficam atrás de um botão; no desktop já estão abertas. */
async function abrirFerramentas(page: Page) {
  const toggle = page.getByRole("button", { name: "Ferramentas" });
  if (await toggle.isVisible()) await toggle.click();
}

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

  test("primeira visita recebe orientação em vez de painel vazio", async ({ page }) => {
    await expect(page.getByText("Como ler este mapa")).toBeVisible();
    await expect(page.getByText(/Cor.*natureza da relação/)).toBeVisible();
  });

  test("busca sem resultado avisa em vez de falhar em silêncio", async ({ page }) => {
    const search = page.getByRole("combobox", { name: /Buscar pessoa/i });
    await search.fill("zzzqx");
    await expect(page.getByRole("listbox")).toContainText(/Nenhum resultado/);
  });

  test("caminho entre dois nós é calculado", async ({ page }) => {
    await abrirFerramentas(page);
    await page.getByRole("button", { name: "Como A se conecta a B?" }).click();
    await page.getByRole("combobox", { name: "Nó de origem" }).fill("Pessoa Exemplo 2");
    await page.getByRole("option").first().click();
    await page.getByRole("combobox", { name: "Nó de destino" }).fill("Pessoa Exemplo 11");
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Buscar caminho" }).click();
    await expect(page.getByText(/Caminho mínimo|Não há caminho/)).toBeVisible();
  });

  test("legenda explica cor e forma", async ({ page }) => {
    await abrirFerramentas(page);
    await page.getByRole("button", { name: "Legenda" }).click();
    await expect(page.getByRole("heading", { name: "Força da evidência" })).toBeVisible();
    await expect(page.getByText(/Nenhuma cor significa ilícito/)).toBeVisible();
  });

  test("permite expandir, fixar, girar e controlar a física", async ({ page }) => {
    const search = page.getByRole("combobox", { name: /Buscar pessoa/i });
    await search.fill("Pessoa Exemplo 2");
    await page.getByRole("option").first().click();

    await abrirMaisAcoes(page);
    await expect(page.getByRole("button", { name: /Expandir para o terceiro grau/ })).toContainText(
      /\+\d+/,
    );
    await abrirMaisAcoes(page);
    await page.getByRole("button", { name: /Expandir para o terceiro grau/ }).click();
    await page.getByRole("button", { name: "Fixar nó no layout" }).click();
    await expect(page.getByRole("button", { name: "Desafixar nó" })).toBeVisible();

    await abrirFerramentas(page);
    await page.getByRole("button", { name: "Girar o grafo para a direita" }).click();
    await page.getByRole("button", { name: "Remover a rotação do grafo" }).click();

    const physics = page.getByRole("button", { name: /^(Reorganizar|Parar)$/ });
    await physics.click();
    await expect(physics).toContainText("Parar");
    await physics.click();
    await expect(physics).toContainText("Reorganizar");
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

    const physics = page.getByRole("button", { name: /^(Reorganizar|Parar)$/ });
    await physics.click();
    await expect(physics).toContainText("Parar");
    await physics.click();
  });
});

test.describe("Card de conexão (corpus real)", () => {
  test("link direto abre a conexão com títulos de fonte e contraditório", async ({ page }) => {
    await page.goto("/grafo?e=rel-daniel-vorcaro-alexandre-de-moraes-allegation");
    await expect(page.getByText("Por que estes nós estão conectados?")).toBeVisible();

    // Fontes com título humano, não identificador técnico.
    const fontes = page.getByRole("link", { name: /Moraes nega que mensagem/i }).first();
    await expect(fontes).toBeVisible();
    await expect(fontes).toHaveAttribute("href", /^\/fontes\//);
    await expect(page.getByText(/^src-/)).toHaveCount(0);

    // Contraditório específico da relação, com autor identificado.
    await expect(page.getByRole("heading", { name: "Posição dos envolvidos" })).toBeVisible();
    await expect(page.getByText("Alexandre de Moraes", { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/Posição não localizada/)).toHaveCount(0);

    // A força da evidência é declarada e o link continua compartilhável.
    await expect(page.getByRole("heading", { name: "Força da evidência" })).toBeVisible();
    expect(page.url()).toContain("e=rel-daniel-vorcaro-alexandre-de-moraes-allegation");
  });
});
