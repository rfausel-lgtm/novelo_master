// Gera os arquivos de um lote a partir de uma especificação compacta (só os campos de CONTEÚDO).
// O redator escreve apenas o texto; o boilerplate (kind, review trail, contagens, affected_ids) sai daqui.
// Uso: node scripts/lote/novo.mjs spec.yaml [--seco]    (--seco: mostra o que criaria, sem gravar)
//
// spec.yaml:
//   data: '2026-10-16'            # created_at/updated_at/reviewed_at e date da Revision
//   revisor: orquestrador
//   lote: 358                     # número do lote (entra no id da Revision)
//   registros:                    # NOVOS registros: `coll` + `id` + campos de conteúdo do schema
//     - { coll: sources, id: src-x, title: ..., publisher: ..., url: ..., source_type: press, ... }
//   revision:
//     slug: titulo-curto-do-lote
//     title: 'Lote 358 — ...'
//     summary: '...'
//     reason: '...'
//     corrections: []
//     tocados: [id-de-registro-existente-alterado, ...]   # só os ALTERADOS (os novos entram sozinhos)
//     updated_relationships: 0
// Registros existentes são editados à mão (Edit) e listados em `tocados`; este script NUNCA sobrescreve.
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { KINDS, ROOT, readYaml } from "./_util.mjs";

const a = process.argv.slice(2);
const specFile = a.find((x) => !x.startsWith("--"));
if (!specFile) {
  console.log("uso: novo.mjs spec.yaml [--seco]");
  process.exit(2);
}
const spec = readYaml(specFile);
const data = String(spec.data);
const revisor = spec.revisor || "orquestrador";
const seco = a.includes("--seco");
const ADDED = {
  people: "people",
  organizations: "organizations",
  events: "events",
  documents: "documents",
  relationships: "relationships",
  sources: "sources",
  evidence: "evidence",
};

const trilha = {
  review_status: "published",
  reviewer: revisor,
  reviewed_at: data,
  created_at: data,
  updated_at: data,
};
const dump = (o) =>
  YAML.stringify(o, { lineWidth: 110, defaultStringType: "PLAIN", defaultKeyType: "PLAIN" });
const escreve = (coll, id, obj) => {
  const f = path.join(ROOT, "data", coll, `${id}.yaml`);
  if (fs.existsSync(f)) throw new Error(`já existe (não sobrescrevo): data/${coll}/${id}.yaml`);
  if (!seco) fs.writeFileSync(f, dump(obj), "utf8");
  console.log(`${seco ? "criaria" : "criado"}: data/${coll}/${id}.yaml`);
};

const ids = [];
const contagem = Object.fromEntries(Object.values(ADDED).map((k) => [k, 0]));
for (const r of spec.registros || []) {
  const { coll, id, ...conteudo } = r;
  if (!KINDS[coll] || coll === "revisions") throw new Error(`coleção inválida: ${coll}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw new Error(`id fora do padrão kebab-case: ${id}`);
  escreve(coll, id, { id, kind: KINDS[coll], ...conteudo, ...trilha });
  ids.push(id);
  if (ADDED[coll]) contagem[ADDED[coll]]++;
}

const rv = spec.revision;
if (rv) {
  const id = `rev-${data}-lote-${spec.lote}-${rv.slug}`;
  escreve("revisions", id, {
    id,
    kind: "revision",
    date: data,
    title: rv.title,
    summary: rv.summary,
    added: contagem,
    updated_relationships: rv.updated_relationships || 0,
    corrections: rv.corrections || [],
    author: revisor,
    affected_ids: [...ids, ...(rv.tocados || [])],
    reason: rv.reason,
    review_status: "published",
    reviewer: revisor,
    reviewed_at: data,
  });
  console.log(
    `added=${JSON.stringify(contagem)} affected_ids=${ids.length + (rv.tocados || []).length}`,
  );
}
console.log("depois: npm run data:lint -- --strict  e  npm run lote:check");
