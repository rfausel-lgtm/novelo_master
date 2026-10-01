/**
 * Quais registros a etapa de IA revisa nesta noite (docs/AUDITORIA_NOTURNA.md).
 *
 * Determinístico e sem rede. O ponteiro da amostra rotativa mora FORA do repositório, no caminho
 * que a máquina que hospeda a rotina passar em `--estado`.
 *
 * Uso:
 *   npm run auditoria:selecao -- --json
 *   npm run auditoria:selecao -- --estado ~/novelo-auditoria/estado.json --escrever-estado --json
 *   npm run auditoria:selecao -- --teto 60 --horas 24 --json
 *
 * Sem `--escrever-estado` nada é gravado: a execução de conferência não consome a fila.
 */
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  arquivosAlterados,
  estadoVazio,
  gravarEstado,
  lerEstado,
  listarRegistros,
  selecionar,
} from "./lib/auditoria/selecao";

const ROOT = path.resolve(__dirname, "..");
const argv = process.argv.slice(2);
const temFlag = (n: string) => argv.includes(n);
const valorDe = (n: string, padrao?: string) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : padrao;
};

const teto = Number(valorDe("--teto", "60"));
const horas = Number(valorDe("--horas", "24"));
const caminhoDoEstado = valorDe("--estado");
const escreverEstado = temFlag("--escrever-estado");
const comoJson = temFlag("--json");

function gitAlterados(): string[] {
  const r = spawnSync(
    "git",
    ["log", `--since=${horas} hours ago`, "--name-only", "--pretty=format:", "--", "data/"],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (r.status !== 0) {
    process.stderr.write(
      `· git log falhou (${r.stderr?.trim()}); seguindo só com a amostra rotativa\n`,
    );
    return [];
  }
  return arquivosAlterados(r.stdout);
}

const todos = listarRegistros(path.join(ROOT, "data"));
const estadoAnterior = caminhoDoEstado ? lerEstado(caminhoDoEstado) : estadoVazio();
const alterados = gitAlterados();
const { registros, estado } = selecionar({ todos, alterados, estado: estadoAnterior, teto });

if (escreverEstado) {
  if (!caminhoDoEstado) {
    process.stderr.write("✖ --escrever-estado exige --estado <arquivo>\n");
    process.exit(2);
  }
  gravarEstado(caminhoDoEstado, estado);
}

const saida = {
  gerado_em: new Date().toISOString(),
  teto,
  janela_horas: horas,
  total_no_acervo: todos.length,
  alterados: registros.filter((r) => r.motivo === "alterado-nas-ultimas-24h").length,
  amostra: registros.filter((r) => r.motivo === "amostra-rotativa").length,
  cursor_anterior: estadoAnterior.cursor,
  cursor: estado.cursor,
  voltas: estado.voltas,
  estado_gravado: escreverEstado ? caminhoDoEstado : null,
  registros,
};

if (comoJson) {
  process.stdout.write(JSON.stringify(saida, null, 2) + "\n");
} else {
  process.stdout.write(
    [
      `${registros.length} registro(s) para revisão (teto ${teto}, acervo ${todos.length})`,
      `  alterados nas últimas ${horas}h: ${saida.alterados}`,
      `  amostra rotativa: ${saida.amostra}`,
      `  ponteiro: ${estadoAnterior.cursor ?? "início"} → ${estado.cursor ?? "início"} (voltas: ${estado.voltas})`,
      "",
      ...registros.map(
        (r) => `  ${r.motivo === "alterado-nas-ultimas-24h" ? "M" : "·"} ${r.arquivo}`,
      ),
    ].join("\n") + "\n",
  );
}
