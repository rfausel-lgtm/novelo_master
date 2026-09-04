import { test, expect } from "@playwright/test";

test("home mostra marca, chamada, estatísticas e última atualização", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /O Novelo Master/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explorar o grafo/i })).toHaveAttribute("href", /^\/grafo\/?$/);
  await expect(page.getByText(/Última atualização/)).toBeVisible();
  await expect(page.getByText("pessoas", { exact: true })).toBeVisible();
});

test("dossiê de pessoa tem as seções obrigatórias", async ({ page }) => {
  await page.goto("/pessoas/daniel-vorcaro");
  await expect(page.getByRole("heading", { level: 1, name: "Daniel Vorcaro" })).toBeVisible();
  for (const h of ["Por que está no Novelo?", "Linha do tempo", "Mais bem documentadas", "Posição do citado", "Lacunas ainda não esclarecidas", "Fontes", "Histórico de atualização"]) {
    await expect(page.getByRole("heading", { name: h })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Ver no grafo" })).toHaveAttribute("href", /^\/grafo\/?\?n=daniel-vorcaro$/);
  await expect(page.getByText("Por que estes nós estão conectados?").first()).toBeAttached();
});

test("fontes listam origem, tipo e verificação", async ({ page }) => {
  await page.goto("/fontes");
  await expect(page.getByRole("heading", { level: 1, name: "Fontes" })).toBeVisible();
  /* Cartões abaixo de md, tabela a partir de md: o link para o dossiê da fonte existe nos dois. */
  await expect(page.locator('#conteudo a[href^="/fontes/"]:not([href="/fontes/"]):visible').first()).toBeVisible();
  await page.getByLabel("Somente fontes oficiais").check();
  // Contador "X de N" da tabela; títulos de fonte também terminam em "de <ano>".
  const contador = page.getByText(/^\d+ de \d+$/);
  await expect(contador).toBeVisible();
  const [visiveis, total] = (await contador.innerText()).split(" de ").map(Number);
  expect(visiveis).toBeLessThan(total);
});

test("cronologia filtra por agente", async ({ page }) => {
  await page.goto("/cronologia");
  const select = page.getByLabel("Agente");
  const total = await page.getByText(/de \d+ registros/).innerText();
  await select.selectOption({ index: 1 });
  const filtered = await page.getByText(/de \d+ registros/).innerText();
  expect(filtered).not.toEqual("");
  expect(total).toContain("registros");
});

test("metodologia e rede em tabela são acessíveis", async ({ page }) => {
  await page.goto("/metodologia");
  await expect(page.getByRole("heading", { level: 1, name: "Metodologia" })).toBeVisible();
  await page.goto("/rede");
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("sumário do dossiê acompanha a rolagem no desktop e recolhe no celular", async ({ page, isMobile }) => {
  await page.goto("/pessoas/daniel-vorcaro");
  if (isMobile) {
    await expect(page.getByText(/^Ir para a seção/)).toBeVisible();
  } else {
    const nav = page.getByRole("navigation", { name: "Seções desta página" });
    await expect(nav).toBeVisible();
    await page.getByRole("heading", { name: "Fontes" }).scrollIntoViewIfNeeded();
    await expect(nav).toBeInViewport();
  }
});
