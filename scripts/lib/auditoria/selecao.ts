import fs from "node:fs";
import path from "node:path";
import { PASTA_DA_COLECAO, type ChaveColecao } from "./corpus";

/**
 * Quais registros a revisão por IA olha nesta noite.
 *
 * Duas entradas, e a ordem entre elas importa:
 *
 *  1. **O que mudou nas últimas 24 h.** É onde o erro acabou de nascer e onde a correção ainda é
 *     barata — o lote publicado ontem à noite.
 *  2. **Amostra rotativa do acervo antigo,** para completar o teto. Sem ela, registro publicado há
 *     seis meses nunca mais seria lido por ninguém. O ponteiro anda a cada execução e dá a volta:
 *     em algumas semanas o acervo inteiro passou.
 *
 * O ponteiro vive FORA do repositório. Ele é estado da máquina que hospeda a rotina, muda toda
 * noite e não é fato do acervo; versioná-lo produziria um commit por dia sem conteúdo editorial.
 */

/** Revisões ficam de fora: são a prosa do lote, e não têm fonte própria contra a qual conferir. */
export const COLECOES_REVISAVEIS: ChaveColecao[] = [
  "people",
  "organizations",
  "events",
  "relationships",
  "claims",
  "sources",
  "documents",
  "public_acts",
  "transactions",
  "evidence",
  "sequences",
];

export type MotivoDaSelecao = "alterado-nas-ultimas-24h" | "amostra-rotativa";

export interface RegistroSelecionado {
  id: string;
  colecao: string;
  arquivo: string;
  motivo: MotivoDaSelecao;
}

export interface EstadoDaSelecao {
  versao: 1;
  /** Último arquivo entregue pela amostra rotativa; a próxima noite começa depois dele. */
  cursor: string | null;
  ultima_execucao?: string;
  /** Quantas vezes a amostra já deu a volta no acervo. */
  voltas: number;
}

export function estadoVazio(): EstadoDaSelecao {
  return { versao: 1, cursor: null, voltas: 0 };
}

/** Todos os registros revisáveis, em ordem estável (coleção, depois id). */
export function listarRegistros(
  dataDir: string,
  colecoes = COLECOES_REVISAVEIS,
): RegistroSelecionado[] {
  const registros: RegistroSelecionado[] = [];
  for (const chave of colecoes) {
    const pasta = PASTA_DA_COLECAO[chave];
    const dir = path.join(dataDir, pasta);
    if (!fs.existsSync(dir)) continue;
    for (const arquivo of fs.readdirSync(dir).sort()) {
      if (!/\.ya?ml$/.test(arquivo)) continue;
      registros.push({
        id: arquivo.replace(/\.ya?ml$/, ""),
        colecao: pasta,
        arquivo: `data/${pasta}/${arquivo}`,
        motivo: "amostra-rotativa",
      });
    }
  }
  return registros;
}

/** Caminhos de `data/` tocados pela saída de `git log --name-only --pretty=format:`. */
export function arquivosAlterados(saidaGit: string): string[] {
  return [
    ...new Set(
      saidaGit
        .split(/\r?\n/)
        .map((l) => l.trim().replace(/\\/g, "/"))
        .filter((l) => /^data\/[^/]+\/[^/]+\.ya?ml$/.test(l)),
    ),
  ].sort();
}

export interface ResultadoDaSelecao {
  registros: RegistroSelecionado[];
  estado: EstadoDaSelecao;
}

/**
 * Fatia mínima do teto que pertence à amostra rotativa.
 *
 * Sem ela a amostra é letra morta neste acervo: um lote publicado à noite toca dezenas de registros,
 * o que mudou nas últimas 24 h enche o teto sozinho, o ponteiro nunca anda e o acervo antigo nunca
 * mais é lido. A reserva garante que uma fatia da noite seja sempre do passado. Quando não há o que
 * mudou, a amostra fica com o teto inteiro.
 */
export const RESERVA_DA_AMOSTRA = 1 / 3;

/**
 * Monta a lista da noite. O que mudou entra primeiro, até o limite que a reserva deixa; a amostra
 * rotativa completa o teto, retomando de onde a noite anterior parou. Se a amostra não usar toda a
 * reserva (acervo menor que o teto), o que mudou volta e ocupa o que sobrou.
 */
export function selecionar(opts: {
  todos: RegistroSelecionado[];
  alterados: string[];
  estado: EstadoDaSelecao;
  teto: number;
  reservaDaAmostra?: number;
  agora?: Date;
}): ResultadoDaSelecao {
  const { todos, teto } = opts;
  const reserva = opts.reservaDaAmostra ?? RESERVA_DA_AMOSTRA;
  const porArquivo = new Map(todos.map((r) => [r.arquivo, r]));

  const escolhidos: RegistroSelecionado[] = [];
  const vistos = new Set<string>();

  const alterados = opts.alterados
    .map((arquivo) => porArquivo.get(arquivo))
    .filter((r): r is RegistroSelecionado => !!r);
  const conjuntoAlterado = new Set(alterados.map((r) => r.arquivo));

  const incluirAlterados = (limite: number) => {
    for (const registro of alterados) {
      if (escolhidos.length >= limite || vistos.has(registro.arquivo)) continue;
      vistos.add(registro.arquivo);
      escolhidos.push({ ...registro, motivo: "alterado-nas-ultimas-24h" });
    }
  };

  /* Conta as vagas da reserva, não o complemento: `1 - 1/3` em ponto flutuante rouba uma vaga. */
  incluirAlterados(Math.max(1, teto - Math.floor(teto * reserva)));

  let voltas = opts.estado.voltas;
  let cursor = opts.estado.cursor;
  if (todos.length > 0 && escolhidos.length < teto) {
    const inicio = cursor ? todos.findIndex((r) => r.arquivo === cursor) + 1 : 0;
    for (let passo = 0; passo < todos.length && escolhidos.length < teto; passo++) {
      const indice = (inicio + passo) % todos.length;
      if (inicio + passo >= todos.length && indice === 0) voltas++;
      const registro = todos[indice];
      cursor = registro.arquivo;
      if (vistos.has(registro.arquivo)) continue;
      vistos.add(registro.arquivo);
      /* O ponteiro passou por cima de algo que também mudou: o motivo mais forte prevalece. */
      escolhidos.push(
        conjuntoAlterado.has(registro.arquivo)
          ? { ...registro, motivo: "alterado-nas-ultimas-24h" }
          : registro,
      );
    }
  }

  incluirAlterados(teto);

  return {
    registros: escolhidos,
    estado: {
      versao: 1,
      cursor,
      voltas,
      ultima_execucao: (opts.agora ?? new Date()).toISOString(),
    },
  };
}

export function lerEstado(caminho: string): EstadoDaSelecao {
  try {
    const bruto = JSON.parse(fs.readFileSync(caminho, "utf8")) as Partial<EstadoDaSelecao>;
    if (bruto.versao !== 1) return estadoVazio();
    return { ...estadoVazio(), ...bruto, versao: 1 };
  } catch {
    return estadoVazio();
  }
}

export function gravarEstado(caminho: string, estado: EstadoDaSelecao): void {
  fs.mkdirSync(path.dirname(path.resolve(caminho)), { recursive: true });
  fs.writeFileSync(caminho, JSON.stringify(estado, null, 2) + "\n", "utf8");
}
