/**
 * Publica uma arte de divulgação com o nome canônico, sem ninguém digitar o id.
 *
 *   npm run social:add -- <arquivo> <numero-do-lote | revision_id>
 *
 * O nome canônico é `<Revision.id>.webp` (docs/ARTE-DE-LOTE.md). Digitá-lo à mão seria fonte de
 * erro silencioso: um id com uma letra trocada não colide com nada, só fica órfão. Aqui o alvo é
 * resolvido contra `data/revisions/`, e ambiguidade é erro que lista as candidatas — nunca palpite.
 *
 * A conversão usa o Chrome já instalado na máquina (`channel: "chrome"`), não o Chromium que o
 * Playwright baixaria à parte. Arte já entregue em WebP conforme é só copiada.
 *
 * Isto não dispensa a conferência humana exigida pela EDITORIAL_POLICY seção 7.1.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { LARGURA_MAXIMA, lerWebp } from "../src/lib/social";
import { DIR_ARTES, nomeCanonico, resolverRevisao } from "./lib/artes";

const [origem, alvo] = process.argv.slice(2);
if (!origem || !alvo) {
  console.error("uso: npm run social:add -- <arquivo> <numero-do-lote | revision_id>");
  process.exit(1);
}
if (!fs.existsSync(origem)) {
  console.error(`arquivo não encontrado: ${origem}`);
  process.exit(1);
}

async function publicar() {
  const revisionId = resolverRevisao(alvo);
  const destino = path.join(DIR_ARTES, nomeCanonico(revisionId));
  fs.mkdirSync(DIR_ARTES, { recursive: true });

  const entrada = fs.readFileSync(origem);
  let saida = entrada;

  const jaConforme = (() => {
    try {
      const { width, animado } = lerWebp(entrada);
      return !animado && width <= LARGURA_MAXIMA;
    } catch {
      return false;
    }
  })();

  if (!jaConforme) {
    const tipo = path.extname(origem).toLowerCase() === ".png" ? "image/png" : "image/webp";
    const navegador = await chromium.launch({ channel: "chrome" });
    try {
      const pagina = await navegador.newPage();
      const base64 = await pagina.evaluate(
        async ([src, largura]: [string, number]) => {
          const img = new Image();
          img.src = src;
          await img.decode();
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(img.naturalWidth, largura);
          canvas.height = Math.round((img.naturalHeight * canvas.width) / img.naturalWidth);
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL("image/webp", 0.8).split(",")[1];
        },
        [`data:${tipo};base64,${entrada.toString("base64")}`, LARGURA_MAXIMA] as [string, number],
      );
      saida = Buffer.from(base64, "base64");
    } finally {
      await navegador.close();
    }
  }

  // Nada é gravado sem passar pelo mesmo leitor que o `--check` usa.
  const { width, height, animado } = lerWebp(saida);
  if (animado) throw new Error("a arte é animada; o contrato admite só WebP estático");
  if (width > LARGURA_MAXIMA) throw new Error(`${width} px acima do limite de ${LARGURA_MAXIMA}`);

  fs.writeFileSync(destino, saida);
  console.log(`${path.basename(destino)}: ${width}x${height}, ${Math.round(saida.length / 1024)} KB`);
  console.log("Confira a arte antes de commitar — EDITORIAL_POLICY.md, seção 7.1.");
}

publicar().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
