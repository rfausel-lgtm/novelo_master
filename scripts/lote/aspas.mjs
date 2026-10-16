// Confere, SEM modelo, se cada trecho entre aspas dos registros novos/alterados existe literalmente
// no texto em cache (scripts/lote/fonte.mjs) das fontes que o próprio registro cita.
// Uso: node scripts/lote/aspas.mjs [--base <ref>] [--head <ref>] [--tudo]
//   padrão: working tree contra HEAD. --tudo lista também os trechos OK.
import fs from "node:fs";
import path from "node:path";
import {
  CACHE,
  ROOT,
  cacheKey,
  changedFiles,
  citacoes,
  fileAt,
  norm,
  parseYaml,
  walkStrings,
} from "./_util.mjs";

const a = process.argv.slice(2);
const opt = (f) => (a.includes(f) ? a[a.indexOf(f) + 1] : null);
const base = opt("--base") || "HEAD";
const headRef = opt("--head");
const files = changedFiles({ base, head: headRef }).filter(
  (f) => f.status !== "D" && /^data\/(?!revisions)[^/]+\/.+\.ya?ml$/.test(f.file),
);

const readColl = (coll, id) => {
  const f = path.join(ROOT, "data", coll, `${id}.yaml`);
  return fs.existsSync(f) ? parseYaml(fs.readFileSync(f, "utf8")) : null;
};
const COLL = { src: "sources", doc: "documents", ev: "evidence" };

/** URLs das fontes/documentos que o registro cita, resolvendo evidências e documentos (2 níveis). */
function urlsDe(record) {
  const ids = new Set();
  for (const [, s] of walkStrings(record))
    for (const m of s.matchAll(/\b(?:src|doc|ev)-[a-z0-9-]+/g)) ids.add(m[0]);
  const urls = new Set();
  const fila = [...ids];
  const vistos = new Set();
  while (fila.length) {
    const id = fila.pop();
    if (vistos.has(id)) continue;
    vistos.add(id);
    const r = readColl(COLL[id.split("-")[0]], id);
    if (!r) continue;
    if (r.url) urls.add(r.url);
    for (const [, s] of walkStrings({ s: r.source_ids, d: r.document_ids })) fila.push(s);
  }
  return [...urls];
}

const textoEmCache = (url) => {
  for (const u of [url, url.endsWith("/") ? url.slice(0, -1) : `${url}/`]) {
    const f = path.join(CACHE, `${cacheKey(u)}.txt`);
    // texto curto = página bloqueada/casca: conta como "sem cache" (use o navegador e fonte.mjs --texto)
    if (fs.existsSync(f)) {
      const t = fs.readFileSync(f, "utf8");
      if (t.length >= 500) return norm(t);
    }
  }
  return null;
};

let ok = 0;
const falhas = [];
for (const { file } of files) {
  const rec = parseYaml(fileAt(headRef, file) ?? "");
  if (!rec) continue;
  const antigo = (() => {
    const t = fileAt(base, file);
    return t ? [...walkStrings(parseYaml(t))].map(([, s]) => s).join("\n") : "";
  })();
  const urls = urlsDe(rec);
  const textos = urls.map(textoEmCache).filter(Boolean);
  for (const [campo, s] of walkStrings(rec)) {
    for (const q of citacoes(s)) {
      if (antigo.includes(q)) continue; // só o que é novo neste lote
      const partes = q
        .split(/\[\.\.\.\]|\.\.\.|…/)
        .map((p) => norm(p))
        .filter((p) => p.length >= 15);
      if (!partes.length) continue;
      if (!textos.length)
        falhas.push({
          file,
          campo,
          q,
          motivo: urls.length ? "SEM-CACHE (rode fonte.mjs nas URLs)" : "sem fonte citada",
        });
      else if (partes.every((p) => textos.some((t) => t.includes(p)))) {
        ok++;
        if (a.includes("--tudo")) console.log(`ok   ${path.basename(file)} :: ${q.slice(0, 70)}`);
      } else if (textos.length < urls.length)
        falhas.push({
          file,
          campo,
          q,
          motivo: `NÃO ACHADO, mas faltam ${urls.length - textos.length} de ${urls.length} fonte(s) em cache (rode fonte.mjs)`,
        });
      else falhas.push({ file, campo, q, motivo: "NÃO ENCONTRADO nas fontes em cache" });
    }
  }
}
console.log(`aspas conferidas: ${ok} ok | ${falhas.length} a revisar | arquivos: ${files.length}`);
for (const f of falhas.slice(0, 60))
  console.log(`- ${f.motivo}: ${f.file} [${f.campo}]\n    “${f.q.slice(0, 150)}”`);
if (falhas.length > 60) console.log(`… +${falhas.length - 60}`);
process.exit(falhas.some((f) => f.motivo.startsWith("NÃO ENCONTRADO")) ? 1 : 0);
