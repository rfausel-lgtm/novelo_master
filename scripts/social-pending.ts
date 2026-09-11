/**
 * Lista revisões novas que ainda não têm arte canônica.
 *
 * O marco inicial é obrigatório: sem ele, o comando se recusa a varrer as revisões históricas.
 * Uso: npm run social:pending -- --since-lot 200 [--limit 5] [--json]
 */
import { revisoesPendentes } from "./lib/artes";

const args = process.argv.slice(2);

function valorDe(nome: string): string | undefined {
  const indice = args.indexOf(nome);
  return indice >= 0 ? args[indice + 1] : undefined;
}

function inteiroPositivo(nome: string, obrigatorio: boolean): number | undefined {
  const valor = valorDe(nome);
  if (valor === undefined && !obrigatorio) return undefined;
  if (valor === undefined || !/^\d+$/.test(valor) || Number(valor) < 1) {
    throw new Error(`${nome} exige um inteiro positivo`);
  }
  return Number(valor);
}

try {
  const desdeLote = inteiroPositivo("--since-lot", true)!;
  const limite = inteiroPositivo("--limit", false);
  const desconhecidos = args.filter(
    (arg, indice) =>
      !["--since-lot", "--limit", "--json"].includes(arg) &&
      !["--since-lot", "--limit"].includes(args[indice - 1] ?? ""),
  );
  if (desconhecidos.length) throw new Error(`argumento desconhecido: ${desconhecidos.join(", ")}`);

  const pendentes = revisoesPendentes(desdeLote);
  const selecionadas = limite === undefined ? pendentes : pendentes.slice(0, limite);
  if (args.includes("--json")) {
    console.log(
      JSON.stringify({ desdeLote, total: pendentes.length, revisions: selecionadas }, null, 2),
    );
  } else if (selecionadas.length === 0) {
    console.log(`nenhuma revisão sem arte a partir do lote ${desdeLote}`);
  } else {
    for (const revisao of selecionadas) {
      console.log(`${revisao.id}\t${revisao.title}`);
    }
    if (selecionadas.length < pendentes.length) {
      console.log(`... ${pendentes.length - selecionadas.length} pendência(s) além do limite`);
    }
  }
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : erro);
  console.error("uso: npm run social:pending -- --since-lot <n> [--limit <n>] [--json]");
  process.exit(1);
}
