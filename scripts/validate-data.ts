/**
 * Valida /data sem gerar artefatos.
 *
 * Uso: npm run data:validate            → erros bloqueiam, avisos informam
 *      npm run data:lint (--strict)     → avisos em registros publicados também bloqueiam
 *      ... --include-drafts             → valida rascunhos também
 */
import path from "node:path";
import { loadCorpus } from "./lib/load";
import { lintCorpus } from "./lib/lint";
import { printIssues } from "./lib/report";

const ROOT = path.resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const includeDrafts = args.has("--include-drafts") || strict;

const { corpus, issues } = loadCorpus({ dataDir: path.join(ROOT, "data"), includeDrafts });
issues.push(...lintCorpus(corpus));
printIssues(issues);

const errors = issues.filter((i) => i.level === "error").length;
const warnings = issues.filter((i) => i.level === "warning").length;
const blockingWarnings = issues.filter((i) => i.level === "warning" && i.published !== false).length;

if (errors > 0 || (strict && blockingWarnings > 0)) {
  console.error(`\n✖ ${errors} erro(s), ${warnings} aviso(s)${strict ? " (modo estrito)" : ""}.`);
  process.exit(1);
}
console.log(`\n✔ dados válidos: ${errors} erro(s), ${warnings} aviso(s).`);
