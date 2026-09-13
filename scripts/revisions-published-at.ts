/**
 * Preenche `published_at` nas revisões que ainda não o têm.
 *
 * Revisão já commitada recebe o instante em que o arquivo entrou no git (data do committer do commit
 * que o adicionou). Revisão ainda não commitada recebe o instante de agora — é o caso de quem acabou
 * de escrever o lote e roda o comando antes do commit.
 *
 * Só roda em clone com histórico completo: CI e Cloudflare clonam raso, e ali toda revisão pareceria
 * publicada no mesmo instante.
 *
 *   npm run data:published-at             mostra o que faria, sem gravar
 *   npm run data:published-at -- --write  grava
 *
 * Insere uma linha logo após `date:`, sem reserializar o YAML: o resto do arquivo fica intacto.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "data", "revisions");
const gravar = process.argv.includes("--write");
const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();

/** Agora, em ISO 8601 com o fuso local explícito (ex.: 2026-09-12T21:24:43-03:00). */
function agoraComFuso(): string {
  const d = new Date();
  const minutos = -d.getTimezoneOffset();
  const sinal = minutos >= 0 ? "+" : "-";
  const dois = (n: number) => String(Math.trunc(Math.abs(n))).padStart(2, "0");
  const local = new Date(d.getTime() + minutos * 60_000).toISOString().slice(0, 19);
  return `${local}${sinal}${dois(minutos / 60)}:${dois(minutos % 60)}`;
}

if (git("rev-parse", "--is-shallow-repository") === "true") {
  console.error(
    "Clone raso: o histórico não diz quando cada revisão entrou. Rode num clone completo.",
  );
  process.exit(1);
}

const pelaHistoria: string[] = [];
const comAgora: string[] = [];
const semLinhaDate: string[] = [];
let jaTinham = 0;

for (const arquivo of fs.readdirSync(DIR).filter((f) => f.endsWith(".yaml")).sort()) {
  const caminho = path.join(DIR, arquivo);
  const texto = fs.readFileSync(caminho, "utf8");
  if (/^published_at:/m.test(texto)) {
    jaTinham++;
    continue;
  }
  const rel = `data/revisions/${arquivo}`;
  const linhas = (...args: string[]) => git("log", ...args, "--format=%cI", "--", rel).split("\n").filter(Boolean);
  /*
   * Commit que adicionou o arquivo. Arquivo que entrou por merge não aparece com --diff-filter=A (o log
   * não mostra o diff de merge), e aí vale o primeiro commit que o tocou. "Agora" é só para revisão
   * que ainda não está no git — dar "agora" a uma antiga a poria no topo do dia dela.
   */
  const historico = linhas("--diff-filter=A", "--follow");
  if (!historico.length) historico.push(...linhas());
  const quando = historico.at(-1) ?? agoraComFuso();
  const eol = texto.includes("\r\n") ? "\r\n" : "\n";
  const novo = texto.replace(/^date:[^\r\n]*\r?\n/m, (linha) => `${linha}published_at: '${quando}'${eol}`);
  if (novo === texto) {
    semLinhaDate.push(arquivo);
    continue;
  }
  (historico.length ? pelaHistoria : comAgora).push(arquivo);
  if (gravar) fs.writeFileSync(caminho, novo);
}

console.log(
  `published_at ${gravar ? "gravado" : "a gravar"}: ${pelaHistoria.length} pelo histórico do git, ` +
    `${comAgora.length} com o horário de agora (ainda não commitadas) · já tinham: ${jaTinham}`,
);
for (const a of comAgora) console.log(`  agora: ${a}`);
if (semLinhaDate.length) {
  console.error(`sem linha "date:", não alteradas: ${semLinhaDate.join(", ")}`);
  process.exitCode = 1;
}
if (!gravar && pelaHistoria.length + comAgora.length > 0) {
  console.log("Nada foi gravado. Repita com: npm run data:published-at -- --write");
}
