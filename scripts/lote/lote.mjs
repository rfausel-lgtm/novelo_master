// Pré-verificação MECÂNICA de um lote (sem modelo). O editor lê o relatório, não os 60 arquivos.
// Uso: node scripts/lote/lote.mjs [--base <ref>] [--head <ref>] [--so-texto]
//   padrão: working tree contra HEAD. --so-texto (saneamento): qualquer chave não textual alterada é falha.
// Falhas (saída 1): `added` ≠ arquivos novos; `published_at` presente; dado pessoal; chave estrutural em --so-texto.
// Alertas (para o editor olhar): affected_ids divergente; chaves críticas alteradas; termo vedado sem atribuição.
import { changedFiles, collOf, fileAt, idOf, parseYaml, walkStrings } from "./_util.mjs";

const a = process.argv.slice(2);
const opt = (f) => (a.includes(f) ? a[a.indexOf(f) + 1] : null);
const base = opt("--base") || "HEAD";
const head = opt("--head");
const soTexto = a.includes("--so-texto");
const headRef = head || null;

const files = changedFiles({ base, head }).filter(
  (f) => /\.ya?ml$/.test(f.file) && f.file.startsWith("data/"),
);
const novos = files.filter((f) => f.status === "A");
const alterados = files.filter((f) => f.status === "M");
const falhas = [];
const alertas = [];

// 1. contagens
const cont = {};
for (const f of novos) cont[collOf(f.file)] = (cont[collOf(f.file)] || 0) + 1;
const revs = novos.filter((f) => collOf(f.file) === "revisions");
console.log(
  `novos: ${novos.length} | alterados: ${alterados.length} | por coleção (novos): ${JSON.stringify(cont)}`,
);
if (revs.length !== 1)
  alertas.push(`Revision nova: ${revs.length} (esperado 1); contagens de 'added' não verificadas`);
else {
  const rev = parseYaml(fileAt(headRef, revs[0].file));
  const add = rev.added || {};
  for (const k of [
    "people",
    "organizations",
    "events",
    "documents",
    "relationships",
    "sources",
    "evidence",
  ]) {
    const real = cont[k] || 0;
    if ((add[k] || 0) !== real)
      falhas.push(`added.${k}=${add[k] || 0} mas há ${real} arquivo(s) novo(s) em data/${k}`);
  }
  if (rev.published_at) falhas.push("Revision traz published_at (o workflow grava)");
  if (!/^rev-\d{4}-\d{2}-\d{2}-/.test(rev.id))
    alertas.push(`id de Revision fora do padrão: ${rev.id}`);
  const esperado = new Set(
    files
      .filter((f) => f.status !== "D" && !(collOf(f.file) === "revisions" && f.status === "A"))
      .map((f) => idOf(f.file)),
  );
  const dado = new Set(rev.affected_ids || []);
  const faltam = [...esperado].filter((i) => !dado.has(i));
  const sobram = [...dado].filter((i) => !esperado.has(i));
  if (faltam.length)
    alertas.push(
      `affected_ids sem ${faltam.length} registro(s) tocado(s): ${faltam.slice(0, 6).join(", ")}${faltam.length > 6 ? "…" : ""}`,
    );
  if (sobram.length)
    alertas.push(
      `affected_ids com ${sobram.length} id(s) não tocados neste lote: ${sobram.slice(0, 6).join(", ")}${sobram.length > 6 ? "…" : ""}`,
    );
  console.log(
    `Revision ${rev.id}: added=${JSON.stringify(add)} affected_ids=${(rev.affected_ids || []).length}`,
  );
}

// 2. diff estrutural dos alterados
const TEXTO = new Set([
  "summary",
  "why_in_novelo",
  "description",
  "label",
  "proposition",
  "statement",
  "notes",
  "excerpt",
  "open_questions",
  "title",
  "role",
  "isolation_reason",
  "limits",
  "updated_at",
  "reviewed_at",
  "reason",
  "corrections",
  "cited_position",
  "counter_position",
]);
const CRITICAS = new Set([
  "evidence_class",
  "classification",
  "status",
  "confidence",
  "date",
  "start_date",
  "end_date",
  "from_id",
  "to_id",
  "relationship_type",
  "kind",
  "created_at",
  "review_status",
  "directed",
]);
const mudou = (x, y) => JSON.stringify(x) !== JSON.stringify(y);
const criticas = [];
const naoTexto = [];
for (const { file } of alterados) {
  const velho = parseYaml(fileAt(base, file) ?? "") || {};
  const novo = parseYaml(fileAt(headRef, file) ?? "") || {};
  for (const k of new Set([...Object.keys(velho), ...Object.keys(novo)])) {
    if (!mudou(velho[k], novo[k])) continue;
    if (CRITICAS.has(k)) criticas.push(`${idOf(file)}.${k}`);
    else if (!TEXTO.has(k)) naoTexto.push(`${idOf(file)}.${k}`);
  }
}
if (criticas.length)
  alertas.push(
    `chaves CRÍTICAS alteradas em ${criticas.length} ponto(s): ${criticas.slice(0, 10).join(", ")}${criticas.length > 10 ? "…" : ""}`,
  );
if (soTexto && (criticas.length || naoTexto.length))
  falhas.push(
    `--so-texto: chaves não textuais alteradas: ${[...criticas, ...naoTexto].slice(0, 12).join(", ")}`,
  );
else if (naoTexto.length)
  console.log(
    `chaves não textuais alteradas (esperado em lotes com fontes/evidências novas): ${naoTexto.length}`,
  );

// 3. varredura de dado pessoal e vocabulário nos textos NOVOS (strings que não existiam no HEAD)
const PESSOAL = [
  [/\d{3}\.\d{3}\.\d{3}-\d{2}/, "CPF completo"],
  [/\bCPF\b[^.;]{0,40}\d{3}/i, "CPF/fragmento"],
  [/\(\d{2}\)\s?9?\d{4}-?\d{4}|\+\d{2}\s?\(?\d{2}\)?\s?9?\d{4}-?\d{4}/, "telefone"],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, "e-mail"],
  [/(nasc(eu|ido|imento)|aniversário)[^.]{0,30}\d{1,2}\/\d{1,2}\/\d{2,4}/i, "data de nascimento"],
];
const REVISAR = /\b(filh[oa]s?|gêmeos|menor(es)? de idade|adolescente|crian[çc]a|esposa|marido)\b/i;
const VEDADO =
  /esquema|propina|criminos|corrup[çc]|fraude|fraudul|lavagem|lavou|indevid|interfer[eê]ncia|advocacia administrativa|quadrilha|bandido|il[ií]cit/i;
const ATRIB =
  /segundo|conforme|de acordo com|afirm|alega|sustenta|aponta|denúncia|diz que|disse|relat|nota d|defesa|negou|nega|decis|acórdão|voto|PF |PGR|MPF|CVM|TCU|imprensa|reportagem|o próprio|“|"/i;
const pessoal = [];
const revisar = [];
const vedados = [];
let vedadosAtrib = 0;
for (const { file, status } of files.filter((f) => f.status !== "D")) {
  const novo = parseYaml(fileAt(headRef, file) ?? "");
  if (!novo) continue;
  const antigo =
    status === "M"
      ? [...walkStrings(parseYaml(fileAt(base, file) ?? ""))].map(([, s]) => s).join("\n")
      : "";
  for (const [campo, s] of walkStrings(novo)) {
    if (antigo.includes(s)) continue;
    const alvo = campo.split(/[.[]/)[0];
    if (
      /(^|\.)(id|url|raw_path|sha256|archive_url|original_url|path)$/.test(campo) ||
      [
        "source_ids",
        "document_ids",
        "evidence_ids",
        "event_ids",
        "affected_ids",
        "participant_ids",
        "related_entity_ids",
      ].includes(alvo)
    )
      continue;
    for (const [re, nome] of PESSOAL)
      if (re.test(s)) pessoal.push(`${nome}: ${idOf(file)} [${campo}]`);
    if (REVISAR.test(s)) revisar.push(`${idOf(file)} [${campo}]`);
    for (const frase of s.split(/(?<=[.;!?])\s+/)) {
      if (!VEDADO.test(frase)) continue;
      if (ATRIB.test(frase)) vedadosAtrib++;
      else vedados.push(`${idOf(file)} [${campo}]: ${frase.slice(0, 140)}`);
    }
  }
}
if (pessoal.length)
  falhas.push(`dado pessoal provável (${pessoal.length}): ${pessoal.slice(0, 8).join(" | ")}`);
if (vedados.length)
  alertas.push(
    `termo vedado SEM atribuição aparente (${vedados.length}; ${vedadosAtrib} com atribuição, não listados):\n    - ${vedados.slice(0, 12).join("\n    - ")}`,
  );
if (revisar.length)
  alertas.push(
    `menção a familiar/menor em texto novo (${revisar.length}): ${revisar.slice(0, 8).join(", ")}${revisar.length > 8 ? "…" : ""}`,
  );

console.log("");
if (falhas.length)
  console.log(`FALHAS (${falhas.length}):\n${falhas.map((x) => "  ✗ " + x).join("\n")}`);
if (alertas.length)
  console.log(
    `ALERTAS para o editor (${alertas.length}):\n${alertas.map((x) => "  ! " + x).join("\n")}`,
  );
if (!falhas.length && !alertas.length) console.log("sem falhas nem alertas mecânicos");
process.exit(falhas.length ? 1 : 0);
