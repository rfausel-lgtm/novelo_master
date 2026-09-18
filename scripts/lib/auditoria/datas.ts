import type { Corpus } from "../../../src/lib/schema";
import { percorrerCorpus } from "./corpus";
import { novoAchado, type Achado } from "./tipos";

/**
 * Datas impossíveis.
 *
 * O schema garante o FORMATO (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`) e nada mais: "2027-01-01" e
 * "1804-02-30" passam pelo Zod sem reclamação. O que esta conferência procura é a data que não pode
 * ser verdade — futura, antiga demais para o caso, ou um fim anterior ao próprio início.
 *
 * Toda comparação respeita a precisão declarada. Uma data parcial é um INTERVALO: "2024" vai de
 * 1º de janeiro a 31 de dezembro. Comparar o pior caso de cada lado é o que evita acusar
 * `start_date: 2024-05` com `end_date: 2024` de terminar antes de começar.
 */

/** Nada no caso Banco Master é anterior a isto; data menor é erro de digitação, não fato. */
export const MARCO_MINIMO = "1900-01-01";

/** A web não entrega página capturada antes disto: `retrieved_at` menor é erro de digitação. */
const MARCO_MINIMO_CAPTURA = "1995-01-01";

/** Primeiro dia possível de uma data parcial. */
export function limiteInferior(data: string): string {
  const [ano, mes] = data.split("-");
  return `${ano}-${mes ?? "01"}-${data.length === 10 ? data.slice(8, 10) : "01"}`;
}

/** Último dia possível de uma data parcial. */
export function limiteSuperior(data: string): string {
  if (data.length === 10) return data;
  if (data.length === 7) {
    const [ano, mes] = data.split("-").map(Number);
    return `${data}-${String(new Date(Date.UTC(ano, mes, 0)).getUTCDate()).padStart(2, "0")}`;
  }
  return `${data}-12-31`;
}

/** Verdadeiro quando a data, mesmo na leitura mais generosa, não pode ter acontecido ainda. */
export function ehFutura(data: string, hoje: string): boolean {
  return limiteInferior(data) > hoje;
}

interface CampoDeData {
  campo: string;
  valor: string | undefined;
  /** `captura` usa o marco da web; o resto usa o marco geral. */
  marco?: "geral" | "captura";
}

interface IntervaloDeData {
  rotulo: string;
  inicio: string | undefined;
  fim: string | undefined;
}

/** Datas e intervalos de cada tipo de registro, por campo, para a mensagem dizer onde está o erro. */
function datasDoRegistro(r: Record<string, unknown>): {
  campos: CampoDeData[];
  intervalos: IntervaloDeData[];
} {
  const s = (chave: string) => (typeof r[chave] === "string" ? (r[chave] as string) : undefined);
  const campos: CampoDeData[] = [
    { campo: "date", valor: s("date") },
    { campo: "end_date", valor: s("end_date") },
    { campo: "start_date", valor: s("start_date") },
    { campo: "publication_date", valor: s("publication_date") },
    { campo: "retrieved_at", valor: s("retrieved_at"), marco: "captura" },
    { campo: "created_at", valor: s("created_at") },
    { campo: "updated_at", valor: s("updated_at") },
    { campo: "reviewed_at", valor: s("reviewed_at") },
  ];
  const intervalos: IntervaloDeData[] = [
    { rotulo: "start_date/end_date", inicio: s("start_date"), fim: s("end_date") },
    { rotulo: "date/end_date", inicio: s("date"), fim: s("end_date") },
  ];

  /* Cargos: cada posição tem seu próprio intervalo e suas próprias datas. */
  const positions = Array.isArray(r.positions) ? (r.positions as Record<string, unknown>[]) : [];
  positions.forEach((pos, i) => {
    const inicio = typeof pos.start_date === "string" ? pos.start_date : undefined;
    const fim = typeof pos.end_date === "string" ? pos.end_date : undefined;
    campos.push({ campo: `positions[${i}].start_date`, valor: inicio });
    campos.push({ campo: `positions[${i}].end_date`, valor: fim });
    intervalos.push({ rotulo: `positions[${i}] (${pos.title ?? "cargo"})`, inicio, fim });
  });

  /* Posição do citado: a manifestação tem data própria. */
  for (const lista of ["cited_position", "counter_position"]) {
    const itens = Array.isArray(r[lista]) ? (r[lista] as Record<string, unknown>[]) : [];
    itens.forEach((item, i) => {
      if (typeof item.date === "string")
        campos.push({ campo: `${lista}[${i}].date`, valor: item.date });
    });
  }

  return { campos, intervalos };
}

export function verificarDatas(corpus: Corpus, hoje: string): Achado[] {
  const achados: Achado[] = [];

  for (const { id, arquivo, registro } of percorrerCorpus(corpus)) {
    const { campos, intervalos } = datasDoRegistro(registro);

    for (const { campo, valor, marco } of campos) {
      if (!valor) continue;
      if (ehFutura(valor, hoje)) {
        achados.push(
          novoAchado({
            categoria: "datas",
            gravidade: "media",
            arquivo,
            registro: id,
            mensagem: `${campo} = ${valor} é futura (hoje é ${hoje}): confira o ano`,
          }),
        );
      }
      const piso = marco === "captura" ? MARCO_MINIMO_CAPTURA : MARCO_MINIMO;
      if (limiteSuperior(valor) < piso) {
        achados.push(
          novoAchado({
            categoria: "datas",
            gravidade: "media",
            arquivo,
            registro: id,
            mensagem: `${campo} = ${valor} é anterior a ${piso.slice(0, 4)}: implausível para este acervo`,
          }),
        );
      }
    }

    for (const { rotulo, inicio, fim } of intervalos) {
      if (!inicio || !fim) continue;
      if (limiteSuperior(fim) < limiteInferior(inicio)) {
        achados.push(
          novoAchado({
            categoria: "datas",
            gravidade: "alta",
            arquivo,
            registro: id,
            mensagem: `${rotulo}: fim (${fim}) anterior ao início (${inicio})`,
          }),
        );
      }
    }

    /* Fonte capturada antes de ter sido publicada. */
    const publicacao = registro.publication_date;
    const captura = registro.retrieved_at;
    if (typeof publicacao === "string" && typeof captura === "string") {
      if (limiteSuperior(captura) < limiteInferior(publicacao)) {
        achados.push(
          novoAchado({
            categoria: "datas",
            gravidade: "baixa",
            arquivo,
            registro: id,
            mensagem: `retrieved_at (${captura}) anterior a publication_date (${publicacao}): não se captura o que ainda não foi publicado`,
          }),
        );
      }
    }
  }

  return achados;
}
