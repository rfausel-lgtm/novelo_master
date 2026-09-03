/**
 * Scanner de segredos de fallback (quando gitleaks não está instalado).
 * Varre arquivos rastreados (ou apenas o índice com --staged) em busca de
 * padrões conhecidos. Nunca imprime o valor do segredo, só arquivo e linha.
 *
 * Uso: npm run scan:secrets [-- --staged]
 */
import { execSync } from "node:child_process";
import fs from "node:fs";

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Anthropic API key", re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "OpenAI API key", re: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/ },
  { name: "GitHub token", re: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: "Slack token", re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: "Google API key", re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "Private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: "Supabase service key (JWT)", re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
  { name: "Generic secret assignment", re: /(?:api[_-]?key|secret|password|passwd|token)\s*[:=]\s*['"][A-Za-z0-9_\-/+=]{16,}['"]/i },
  { name: "Connection string with password", re: /[a-z]+:\/\/[^:\s/]+:[^@\s/]{4,}@[^\s]+/i },
];

const SKIP = [/^node_modules\//, /^package-lock\.json$/, /^\.gitleaks\.toml$/, /^scripts\/scan-secrets\.ts$/, /\.(png|jpg|jpeg|gif|webp|ico|woff2?)$/i];

const staged = process.argv.includes("--staged");
const cmd = staged ? "git diff --cached --name-only --diff-filter=ACMR" : "git ls-files";
const files = execSync(cmd, { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((f) => !SKIP.some((re) => re.test(f)));

let hits = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const stat = fs.statSync(file);
  if (!stat.isFile() || stat.size > 2_000_000) continue;
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    for (const p of PATTERNS) {
      if (p.re.test(line)) {
        hits++;
        console.error(`[segredo?] ${file}:${idx + 1} — ${p.name} (valor omitido)`);
      }
    }
  });
}

if (hits > 0) {
  console.error(`\n✖ ${hits} possível(is) segredo(s). Remova antes de commitar.`);
  process.exit(1);
}
console.log(`✔ nenhum padrão de segredo em ${files.length} arquivo(s).`);
