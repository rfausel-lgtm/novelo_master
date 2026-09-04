import { test, expect } from "@playwright/test";

function positiveBudget(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const STRESS_BUDGET = {
  loadMs: positiveBudget("NOVELO_STRESS_MAX_LOAD_MS", 30_000),
  interactionMs: positiveBudget("NOVELO_STRESS_MAX_INTERACTION_MS", 5_000),
  frameDelayMs: positiveBudget("NOVELO_STRESS_MAX_FRAME_DELAY_MS", 2_000),
  longTaskMs: positiveBudget("NOVELO_STRESS_MAX_LONG_TASK_MS", 2_000),
};

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
  test("mede carregamento e responsividade em 5.000/25.000", async ({ page }, testInfo) => {
    test.skip(
      process.env.NOVELO_STRESS !== "1",
      "Executado apenas pelo job agendado/manual de stress.",
    );
    test.setTimeout(90_000);
    await page.addInitScript(() => {
      const monitoredWindow = window as Window & { __noveloLongTasks?: number[] };
      monitoredWindow.__noveloLongTasks = [];
      if (typeof PerformanceObserver === "undefined") return;
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            monitoredWindow.__noveloLongTasks?.push(entry.duration);
          }
        });
        observer.observe({ type: "longtask", buffered: true });
      } catch {
        // Long Tasks não está disponível em todos os engines; o teste ainda mede frame delay.
      }
    });

    const navigationStarted = Date.now();
    await page.goto("/grafo?dataset=stress");
    const canvas = page.getByTestId("graph-canvas");
    await expect(canvas).toBeVisible({ timeout: 45_000 });
    await expect(canvas).toHaveAttribute("aria-label", /5\.000 nós|5000 nós/, { timeout: 45_000 });
    const loadMs = Date.now() - navigationStarted;

    await page.evaluate(() => {
      const monitoredWindow = window as Window & { __noveloLongTasks?: number[] };
      monitoredWindow.__noveloLongTasks = [];
    });

    const search = page.getByRole("combobox", { name: /Buscar pessoa/i });
    const searchStarted = Date.now();
    await search.fill("Pessoa Exemplo 2");
    await expect(page.getByRole("option").first()).toBeVisible();
    const searchMs = Date.now() - searchStarted;
    await page.getByRole("option").first().click();
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();

    await page.getByRole("button", { name: "Filtros" }).click();
    const filterStarted = Date.now();
    await page.getByRole("button", { name: "MOSTRAR SOMENTE FATOS DOCUMENTADOS" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "SOMENTE FATOS DOCUMENTADOS" }),
    ).toBeVisible();
    const filterMs = Date.now() - filterStarted;

    const physics = page.getByRole("button", { name: "Reorganizar o layout" });
    const physicsStarted = Date.now();
    await physics.click();
    await expect(physics).toContainText("Pausar física");
    const physicsMs = Date.now() - physicsStarted;
    const frameDelayMs = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const started = performance.now();
          requestAnimationFrame(() => resolve(performance.now() - started));
        }),
    );
    await page.waitForTimeout(750);
    const longTasks = await page.evaluate(() => {
      const monitoredWindow = window as Window & { __noveloLongTasks?: number[] };
      return monitoredWindow.__noveloLongTasks ?? [];
    });
    await physics.click();

    const metrics = {
      dataset: { nodes: 5_000, edges: 25_000 },
      loadMs,
      searchMs,
      filterMs,
      physicsMs,
      frameDelayMs: Math.round(frameDelayMs),
      maxLongTaskMs: Math.round(Math.max(0, ...longTasks)),
      longTaskCount: longTasks.length,
      budgets: STRESS_BUDGET,
    };
    await testInfo.attach("graph-stress-metrics.json", {
      body: Buffer.from(JSON.stringify(metrics, null, 2)),
      contentType: "application/json",
    });

    expect(metrics.loadMs, "tempo até o canvas ficar pronto").toBeLessThanOrEqual(
      STRESS_BUDGET.loadMs,
    );
    for (const [operation, duration] of Object.entries({ searchMs, filterMs, physicsMs })) {
      expect(duration, `latência de ${operation}`).toBeLessThanOrEqual(STRESS_BUDGET.interactionMs);
    }
    expect(metrics.frameDelayMs, "atraso de frame durante a física").toBeLessThanOrEqual(
      STRESS_BUDGET.frameDelayMs,
    );
    expect(metrics.maxLongTaskMs, "maior long task após o carregamento").toBeLessThanOrEqual(
      STRESS_BUDGET.longTaskMs,
    );
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

  test("link direto para conexão probatória carrega a camada sob demanda", async ({
    page,
    request,
  }) => {
    const response = await request.get("/data/graph-evidence.json");
    expect(response.ok()).toBeTruthy();
    const layer = (await response.json()) as { edges: Array<{ id: string }> };
    expect(layer.edges.length).toBeGreaterThan(0);

    const edgeId = layer.edges[0].id;
    await page.goto(`/grafo?e=${encodeURIComponent(edgeId)}`);

    await expect(page.getByText("Por que estes nós estão conectados?")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("A seleção ficou fora do recorte atual.")).toHaveCount(0);
    expect(page.url()).toContain(`e=${encodeURIComponent(edgeId)}`);
  });

  test("falha da camada informa o erro e permite tentar novamente", async ({ page }) => {
    let attempts = 0;
    await page.route("**/data/graph-evidence.json", async (route) => {
      attempts++;
      if (attempts === 1) {
        await route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
        return;
      }
      await route.continue();
    });

    await page.goto("/grafo");
    const canvas = page.getByTestId("graph-canvas");
    await expect(canvas).toBeVisible({ timeout: 20_000 });
    const before = await canvas.getAttribute("aria-label");

    await page.getByRole("button", { name: "Filtros" }).click();
    await page.getByRole("button", { name: "CAMADA DE EVIDÊNCIA" }).click();
    const alert = page
      .getByRole("alert")
      .filter({ hasText: "Não foi possível carregar a camada probatória" });
    await expect(alert).toBeVisible();

    await alert.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(alert).toHaveCount(0, { timeout: 20_000 });
    await expect(canvas).not.toHaveAttribute("aria-label", before ?? "", { timeout: 20_000 });
    expect(attempts).toBe(2);
  });
});
