// Utilidades comuns das ferramentas de lote (docs/PIPELINE_DE_LOTES.md). Sem modelo, sem rede.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
// NOVELO_CACHE compartilha o cache entre worktrees (aponte para o do repositório principal).
export const CACHE = process.env.NOVELO_CACHE || path.join(ROOT, "processed", "fontes-cache");

/** Pasta de dados -> `kind` do schema. */
export const KINDS = {
  people: "person",
  organizations: "organization",
  events: "event",
  "public-acts": "public_act",
  transactions: "transaction",
  relationships: "relationship",
  claims: "claim",
  sources: "source",
  documents: "document",
  evidence: "evidence",
  sequences: "temporal_sequence",
  revisions: "revision",
};

export const git = (...args) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });

export const sha = (s, alg = "sha256") => createHash(alg).update(s).digest("hex");

export const cacheKey = (url) => sha(url.replace(/#.*$/, ""), "sha1").slice(0, 16);

/** Normaliza para comparar trechos: sem acento, caixa baixa, aspas/travessões/reticências unificados. */
export const norm = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[“”«»„]/g, '"')
    .replace(/[‘’`´]/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim();

export const readYaml = (file) => YAML.parse(fs.readFileSync(file, "utf8"));
export const parseYaml = (text) => YAML.parse(text);

/** Percorre todas as strings de um valor YAML, devolvendo [caminho, texto]. */
export function* walkStrings(v, p = "") {
  if (typeof v === "string") yield [p, v];
  else if (Array.isArray(v))
    for (let i = 0; i < v.length; i++) yield* walkStrings(v[i], `${p}[${i}]`);
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) yield* walkStrings(x, p ? `${p}.${k}` : k);
}

/** Arquivos de dados alterados: [{status:'A'|'M'|'D', file}] no working tree ou entre dois refs. */
export function changedFiles({ base = "HEAD", head = null, paths = ["data", "raw"] } = {}) {
  const out = [];
  if (head) {
    for (const l of git("diff", "--name-status", base, head, "--", ...paths).split("\n")) {
      if (!l.trim()) continue;
      const [st, f] = l.split("\t");
      out.push({ status: st[0], file: f });
    }
  } else {
    for (const l of git("status", "--porcelain=v1", "-uall", "--", ...paths).split("\n")) {
      if (!l.trim()) continue;
      const xy = l.slice(0, 2);
      const f = l.slice(3).replace(/^"|"$/g, "");
      const st = xy.includes("?") || xy.includes("A") ? "A" : xy.includes("D") ? "D" : "M";
      out.push({ status: st, file: f });
    }
  }
  return out;
}

/** Conteúdo de um arquivo num ref (ou no working tree se ref==null). Null se não existir. */
export function fileAt(ref, file) {
  try {
    if (!ref) return fs.readFileSync(path.join(ROOT, file), "utf8");
    return execFileSync("git", ["show", `${ref}:${file}`], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

export const collOf = (file) => file.split("/")[1];
export const idOf = (file) => path.basename(file).replace(/\.ya?ml$/, "");

/** Trechos entre aspas (curvas ou retas pareadas), 20 a 500 caracteres. */
export function citacoes(s) {
  const t = s.replace(/\s+/g, " ");
  const out = [];
  for (const m of t.matchAll(/“([^”]{20,500})”/g)) out.push(m[1]);
  const sem = t.replace(/“[^”]*”/g, " ");
  const partes = sem.split('"');
  if (partes.length > 1 && partes.length % 2 === 1)
    for (let i = 1; i < partes.length; i += 2)
      if (partes[i].length >= 20 && partes[i].length <= 500) out.push(partes[i]);
  return out;
}
