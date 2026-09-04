/**
 * Compila /data (YAML) → src/generated/corpus.json + public/data/graph.json.
 *
 * Uso: npm run data:build [-- --include-drafts] [--no-layout]
 *
 * Falha (exit 1) se houver erro de schema, referência quebrada ou violação
 * das regras editoriais bloqueantes (scripts/lib/lint.ts).
 */
import fs from "node:fs";
import path from "node:path";
import { loadCorpus } from "./lib/load";
import { lintCorpus } from "./lib/lint";
import { buildGraph, splitEvidenceLayer } from "./lib/graph";
import { printIssues } from "./lib/report";
import { construirKml } from "./lib/kml";
import { construirAcervo, construirLlmsTxt } from "./lib/acervo";

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const GENERATED_DIR = path.join(ROOT, "src", "generated");
const PUBLIC_DIR = path.join(ROOT, "public");
const PUBLIC_DATA_DIR = path.join(PUBLIC_DIR, "data");

const args = new Set(process.argv.slice(2));
const includeDrafts =
  args.has("--include-drafts") || process.env.NOVELO_INCLUDE_DRAFTS === "true";
const doLayout = !args.has("--no-layout");

const t0 = Date.now();
const { corpus, issues } = loadCorpus({ dataDir: DATA_DIR, includeDrafts });
issues.push(...lintCorpus(corpus));

const errors = issues.filter((i) => i.level === "error");
printIssues(issues);

if (errors.length > 0) {
  console.error(`\n✖ ${errors.length} erro(s) bloqueante(s). Build de dados abortado.`);
  process.exit(1);
}

const graph = buildGraph(corpus, { layout: doLayout });

fs.mkdirSync(GENERATED_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
fs.writeFileSync(path.join(GENERATED_DIR, "corpus.json"), JSON.stringify(corpus));
fs.writeFileSync(path.join(GENERATED_DIR, "stats.json"), JSON.stringify(graph.stats, null, 2));
/* O núcleo é o que todo visitante baixa; a camada probatória fica em arquivo à parte. */
const { base, layer } = splitEvidenceLayer(graph);
fs.writeFileSync(path.join(PUBLIC_DATA_DIR, "graph.json"), JSON.stringify(base));
fs.writeFileSync(path.join(PUBLIC_DATA_DIR, "graph-evidence.json"), JSON.stringify(layer));
/*
 * KML com tudo que tem coordenada. O link para o Google Earth resolve um lugar de cada vez; quem
 * quer abrir o caso inteiro (jornalista, pesquisador) precisa de um arquivo só, e o KML abre no
 * Earth, no Maps e no QGIS sem conversão.
 */
const kml = construirKml(corpus);
fs.writeFileSync(path.join(PUBLIC_DATA_DIR, "novelo.kml"), kml.texto);

/*
 * Acervo em texto e indice llms.txt: uma extensão de navegador lê a página aberta, não o site.
 * Sem um artefato único, "analise o acervo" vira resposta baseada em uma página só.
 */
const acervo = construirAcervo(corpus);
fs.writeFileSync(path.join(PUBLIC_DIR, "acervo.txt"), acervo.texto);
fs.writeFileSync(path.join(PUBLIC_DIR, "llms.txt"), construirLlmsTxt(corpus));

fs.writeFileSync(
  path.join(GENERATED_DIR, ".gitkeep"),
  "# gerado por scripts/build-data.ts — não editar\n",
);

const s = graph.stats;
console.log(
  `\n✔ corpus compilado em ${Date.now() - t0} ms: ` +
    `${s.people} pessoas, ${s.organizations} organizações, ${s.events} eventos, ` +
    `${s.public_acts} atos, ${s.relationships} relações, ${s.documents} documentos, ` +
    `${s.sources} fontes (${s.official_sources} oficiais), ${s.evidence} evidências → ` +
    `${base.nodes.length} nós / ${base.edges.length} arestas no núcleo ` +
    `(+${layer.nodes.length} nós e ${layer.edges.length} arestas na camada probatória; ` +
    `${kml.lugares} lugar(es) no KML; acervo.txt com ${acervo.registros} registros, ` +
    `${Math.round(acervo.texto.length / 1024)} KB)`,
);
