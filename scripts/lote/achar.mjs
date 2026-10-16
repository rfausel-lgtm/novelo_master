// Busca barata de duplicata/identidade no acervo (substitui ler o índice de 80 KB).
// Uso: node scripts/lote/achar.mjs "Nome ou trecho" [--eventos] [--tudo]
//   procura em id, name, full_name e aliases de people e organizations (e títulos de events com --eventos).
import fs from "node:fs";
import path from "node:path";
import { ROOT, norm, parseYaml } from "./_util.mjs";

const a = process.argv.slice(2);
const termo = a.filter((x) => !x.startsWith("--")).join(" ");
if (!termo) {
  console.log('uso: achar.mjs "Nome" [--eventos] [--tudo]');
  process.exit(2);
}
const alvo = norm(termo);
const tokens = alvo.split(" ").filter((t) => t.length > 2);
const colls = ["people", "organizations", ...(a.includes("--eventos") ? ["events"] : [])];
const achados = [];
for (const c of colls) {
  const dir = path.join(ROOT, "data", c);
  for (const f of fs.readdirSync(dir)) {
    const r = parseYaml(fs.readFileSync(path.join(dir, f), "utf8"));
    const rotulos = [r.id, r.name, r.full_name, r.title, ...(r.aliases || [])].filter(Boolean);
    const n = rotulos.map(norm);
    const exato = n.some((x) => x === alvo || x.replace(/-/g, " ") === alvo);
    const contem = n.some((x) => x.includes(alvo) || alvo.includes(x.replace(/-/g, " ")));
    const todos =
      tokens.length > 1 && tokens.every((t) => n.some((x) => x.replace(/-/g, " ").includes(t)));
    if (exato || contem || todos)
      achados.push({
        c,
        id: r.id,
        nome: r.name || r.title,
        papel: String(r.role || r.org_type || "").slice(0, 60),
        peso: exato ? 0 : contem ? 1 : 2,
        distinct: (r.distinct_from || []).join(","),
      });
  }
}
achados.sort((x, y) => x.peso - y.peso);
for (const x of achados.slice(0, a.includes("--tudo") ? 100 : 12))
  console.log(
    `${["=", "~", "?"][x.peso]} ${x.c}/${x.id} | ${x.nome} | ${x.papel}${x.distinct ? ` | distinct_from: ${x.distinct}` : ""}`,
  );
if (!achados.length) console.log("nenhum registro com esse nome, id ou alias");
