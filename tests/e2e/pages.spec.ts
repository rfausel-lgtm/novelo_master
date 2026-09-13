import { test, expect } from "@playwright/test";

test("home mostra marca, chamada, estatísticas e última atualização", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /O Novelo Master/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explorar o grafo/i })).toHaveAttribute(
    "href",
    /^\/grafo\/?$/,
  );
  await expect(page.getByText(/Última atualização/)).toBeVisible();
  await expect(page.getByText("pessoas", { exact: true })).toBeVisible();
});

test("dossiê de pessoa tem as seções obrigatórias", async ({ page }) => {
  await page.goto("/pessoas/daniel-vorcaro");
  await expect(page.getByRole("heading", { level: 1, name: "Daniel Vorcaro" })).toBeVisible();
  for (const h of [
    "Por que está no Novelo?",
    "Linha do tempo",
    "Mais bem documentadas",
    "Posição do citado",
    "Lacunas ainda não esclarecidas",
    "Fontes",
    "Histórico de atualização",
  ]) {
    await expect(page.getByRole("heading", { name: h })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Ver no grafo" })).toHaveAttribute(
    "href",
    /^\/grafo\/?\?n=daniel-vorcaro$/,
  );
  await expect(page.getByText("Por que estes nós estão conectados?").first()).toBeAttached();
});

test("fontes listam origem, tipo e verificação", async ({ page }) => {
  await page.goto("/fontes");
  await expect(page.getByRole("heading", { level: 1, name: "Fontes" })).toBeVisible();
  /* Cartões abaixo de md, tabela a partir de md: o link para o dossiê da fonte existe nos dois. */
  await expect(
    page.locator('#conteudo a[href^="/fontes/"]:not([href="/fontes/"]):visible').first(),
  ).toBeVisible();
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

test("sumário do dossiê acompanha a rolagem no desktop e recolhe no celular", async ({
  page,
  isMobile,
}) => {
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

test("recorte da cronologia vive na URL e sobrevive a voltar do registro", async ({ page }) => {
  await page.goto("/cronologia/?agente=jaques-wagner&classe=D");
  await expect(page.getByLabel("Agente")).toHaveValue("jaques-wagner");
  const antes = await page.getByText(/de \d+ registros/).innerText();
  /* Cartões abaixo de md, tabela a partir de md: só um dos dois está visível. */
  await page.locator('a[href^="/eventos/"]:visible').first().click();
  await expect(page).toHaveURL(/\/eventos\//);
  await page.goBack();
  await expect(page).toHaveURL(/agente=jaques-wagner/);
  await expect(page.getByLabel("Agente")).toHaveValue("jaques-wagner");
  await expect(page.getByText(/de \d+ registros/)).toHaveText(antes);
});

test("índice filtra pelo termo da URL e oferece o link do recorte", async ({ page }) => {
  await page.goto("/pessoas/?q=vorcaro");
  await expect(page.getByRole("searchbox")).toHaveValue("vorcaro");
  await expect(page.getByText(/resultado\(s\)/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Copiar link/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Daniel Vorcaro" })).toBeVisible();
});

test("dossiê oferece cópia e download do texto, com o tamanho à vista", async ({ page }) => {
  await page.goto("/organizacoes/banco-master/");
  await expect(page.getByRole("button", { name: "Copiar dossiê" })).toBeVisible();
  const baixar = page.getByRole("link", { name: "Baixar .txt" });
  await expect(baixar).toHaveAttribute("href", "/dossies/banco-master.txt");
  await expect(page.getByText(/^\d+ KB/)).toBeVisible();
  const r = await page.request.get("/dossies/banco-master.txt");
  expect(r.status()).toBe(200);
  expect(await r.text()).toContain("Nunca afirme crime");
});

test("home lista as três últimas revisões, da mais recente para a mais antiga", async ({
  page,
}) => {
  await page.goto("/");
  const links = page.locator('a[href^="/atualizacoes/#rev-"]');
  await expect(links).toHaveCount(3);
  /*
   * A asserção é sobre a REGRA de ordem, não sobre qual revisão é a última: o corpus ganha revisões o
   * tempo todo, e fixar um id aqui quebraria o CI a cada publicação. A regra é data editorial e,
   * dentro dela, o instante de publicação. Número de lote não serve: saneamento e auditoria não têm.
   */
  /*
   * Mesma regra de compararRevisoes: revisão ainda sem `published_at` conta como a mais recente do
   * dia — acabou de sair e não foi carimbada —, então vem antes das que têm. Exigir o atributo aqui
   * poria o CI vermelho a cada lote publicado sem o carimbo, com o site certo.
   */
  const itens = (await links.evaluateAll((as) =>
    as.map((a) => {
      const li = a.closest("li");
      return [
        li?.querySelector("time")?.getAttribute("datetime") ?? "",
        li?.getAttribute("data-published-at") ?? null,
      ];
    }),
  )) as [string, string | null][];
  expect(itens.every(([data]) => data !== "")).toBe(true);
  const instante = (p: string | null) => (p ? Date.parse(p) : Number.POSITIVE_INFINITY);
  const ordenado = [...itens].sort(
    (a, b) => b[0].localeCompare(a[0]) || Math.sign(instante(b[1]) - instante(a[1])) || 0,
  );
  expect(itens).toEqual(ordenado);
  const primeiro = await links.first().getAttribute("href");
  await links.first().click();
  await expect(page).toHaveURL(new RegExp(`${primeiro!.split("#")[1]}$`));
});
