/**
 * Gera o card padrão das revisões que ainda não têm arte.
 *
 *   npm run social:cards                  # todas as revisões sem arte
 *   npm run social:cards -- 216           # só esse lote (ou o Revision.id completo)
 *   npm run social:cards -- 216 --force   # regera por cima, inclusive de ilustração já publicada
 *
 * Sem `--force` nada é sobrescrito: o arquivo canônico presente é o estado durável de conclusão
 * (docs/ARTE-DE-LOTE.md), e é por ele que uma ilustração do Codex, quando existir, prevalece sobre o
 * card. `--force` é a única forma de desfazer isso, e é sempre explícita.
 *
 * O navegador é aberto uma vez para o lote inteiro: abrir por card multiplicava o custo pelo número
 * de revisões, e são centenas.
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { chromium, type Browser } from "@playwright/test";
import { LARGURA_MAXIMA, lerWebp } from "../src/lib/social";
import {
  DIR_ARTES,
  DIR_REVISOES,
  gravarManifestoDeCards,
  idsDeRevisao,
  lerManifestoDeCards,
  nomeCanonico,
  resolverRevisao,
} from "./lib/artes";
import {
  ALTURA,
  LARGURA,
  desenhoDe,
  htmlDoCard,
  mancheteDoResumo,
  repartirTitulo,
} from "./lib/card";

const args = process.argv.slice(2);
const force = args.includes("--force");
const alvo = args.find((a) => !a.startsWith("--"));

type Revisao = { id: string; date: string; title: string };

function lerRevisao(id: string): Revisao {
  const doc = parse(fs.readFileSync(path.join(DIR_REVISOES, `${id}.yaml`), "utf8")) as {
    id?: unknown;
    date?: unknown;
    title?: unknown;
    summary?: unknown;
  };
  if (doc.id !== id) throw new Error(`${id}: o campo id do YAML não bate com o nome do arquivo`);
  if (typeof doc.date !== "string" || !doc.date.trim()) throw new Error(`${id}: sem data`);
  // `title` é opcional no schema; nessas revisões a abertura do `summary` faz as vezes de manchete.
  const titulo =
    typeof doc.title === "string" && doc.title.trim()
      ? doc.title
      : typeof doc.summary === "string" && doc.summary.trim()
        ? mancheteDoResumo(doc.summary)
        : null;
  if (!titulo) throw new Error(`${id}: sem título nem resumo de onde tirar a manchete`);
  return { id, date: doc.date, title: titulo };
}

/**
 * O Chrome do sistema é o que `social:add` usa e o que existe na máquina do Rafael; o Chromium
 * empacotado é o que existe no runner do Actions. Tentar os dois evita um script que só roda num
 * dos dois lugares — e foi exatamente esse tipo de dependência de ambiente que travou a cadeia
 * anterior.
 */
async function abrirNavegador(): Promise<Browser> {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return await chromium.launch();
  }
}

async function gerar() {
  const ids = idsDeRevisao().sort();
  const existentes = new Set(fs.existsSync(DIR_ARTES) ? fs.readdirSync(DIR_ARTES) : []);

  const selecionados = alvo ? [resolverRevisao(alvo)] : ids;
  const pendentes = selecionados.filter((id) => force || !existentes.has(nomeCanonico(id)));

  if (pendentes.length === 0) {
    console.log(
      alvo
        ? `${selecionados[0]} já tem arte (use --force para regerar)`
        : "nenhuma revisão sem arte",
    );
    return;
  }

  fs.mkdirSync(DIR_ARTES, { recursive: true });
  const gerados: string[] = [];
  const navegador = await abrirNavegador();
  try {
    const pagina = await navegador.newPage({
      viewport: { width: LARGURA, height: ALTURA },
      deviceScaleFactor: 1,
    });
    for (const id of pendentes) {
      const revisao = lerRevisao(id);
      const { eyebrow, manchete } = repartirTitulo(revisao.title, id, revisao.date);
      await pagina.setContent(htmlDoCard({ eyebrow, manchete, desenho: desenhoDe(id) }), {
        waitUntil: "networkidle",
      });
      await pagina.evaluate(() => document.fonts.ready);
      const png = await pagina.screenshot({ type: "png" });

      // PNG → WebP pelo mesmo caminho de social:add, que é o único codificador disponível aqui.
      const base64 = await pagina.evaluate(
        (dados) =>
          new Promise<string>((ok, erro) => {
            const img = new Image();
            img.onload = () => {
              const cv = document.createElement("canvas");
              cv.width = img.naturalWidth;
              cv.height = img.naturalHeight;
              cv.getContext("2d")!.drawImage(img, 0, 0);
              ok(cv.toDataURL("image/webp", 0.9).split(",")[1]);
            };
            img.onerror = () => erro(new Error("falhou ao decodificar o PNG intermediário"));
            img.src = "data:image/png;base64," + dados;
          }),
        png.toString("base64"),
      );
      const saida = Buffer.from(base64, "base64");

      // Nada é gravado sem passar pelo mesmo leitor que o `social:check` usa.
      const { width, animado } = lerWebp(saida);
      if (animado) throw new Error(`${id}: card saiu animado, o que o contrato não admite`);
      if (width > LARGURA_MAXIMA) throw new Error(`${id}: ${width} px acima do limite`);

      fs.writeFileSync(path.join(DIR_ARTES, nomeCanonico(id)), saida);
      gerados.push(id);
      console.log(`${nomeCanonico(id)} · ${Math.round(saida.length / 1024)} KB`);
    }
  } finally {
    await navegador.close();
  }

  // O manifesto só é gravado depois de o último card estar em disco: interromper no meio deixa
  // arquivos gerados sem registro (que o site trata como ilustração, a legenda cautelosa), nunca o
  // contrário.
  const manifesto = lerManifestoDeCards();
  for (const id of gerados) manifesto.add(id);
  gravarManifestoDeCards(manifesto);

  console.log(`${pendentes.length} card(s) gerado(s).`);
}

gerar().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
