/**
 * Camada determinística da auditoria noturna (docs/AUDITORIA_NOTURNA.md).
 *
 * Só RELATA: não escreve em `data/`, não corrige, não commita, não publica. A saída é um JSON
 * estável — mesma entrada, mesmos achados, na mesma ordem — para a máquina que hospeda a rotina
 * comparar com a noite anterior e avisar só o que é novo.
 *
 * Uso:
 *   npm run auditoria -- --json                 relatório completo em JSON no stdout
 *   npm run auditoria -- --json --sem-rede      sem link rot (CI e teste: nenhuma chamada externa)
 *   npm run auditoria -- --sem-verificacoes     sem testes, build e scanner de segredos
 *   npm run auditoria -- --saida relatorio.json grava o JSON em arquivo
 *   npm run auditoria -- --estado ~/novelo-auditoria/links.json   cache do link rot
 *
 * Código de saída: 0 mesmo havendo achados — quem decide o que fazer com eles é o runner.
 * Diferente de 0 apenas quando a própria ferramenta falha.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadCorpus } from "./lib/load";
import { lintCorpus } from "./lib/lint";
import { verificarIntegridade } from "./lib/auditoria/integridade";
import { verificarDatas } from "./lib/auditoria/datas";
import { verificarDuplicidade } from "./lib/auditoria/duplicidade";
import { varrerConteudo } from "./lib/auditoria/lgpd";
import {
  cacheVazio,
  verificarLinks,
  type AlvoDeLink,
  type CacheDeLinks,
} from "./lib/auditoria/link-rot";
import {
  novoAchado,
  ordenarAchados,
  type Achado,
  type Gravidade,
  type Relatorio,
  type StatusVerificacao,
} from "./lib/auditoria/tipos";

const ROOT = path.resolve(__dirname, "..");

/* ------------------------------------------------------------------ */
/* Argumentos                                                          */
/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const temFlag = (nome: string) => argv.includes(nome);
const valorDe = (nome: string, padrao?: string) => {
  const i = argv.indexOf(nome);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : padrao;
};

const comoJson = temFlag("--json");
const semRede = temFlag("--sem-rede");
const semVerificacoes = temFlag("--sem-verificacoes");
const arquivoDeSaida = valorDe("--saida");
const arquivoDeEstado = valorDe("--estado");
const limiteDeLinks = Number(valorDe("--limite-links", "400"));

const log = (msg: string) => process.stderr.write(`${msg}\n`);

/* ------------------------------------------------------------------ */
/* Arquivos rastreados (varredura de dado pessoal)                     */
/* ------------------------------------------------------------------ */

/**
 * O que a varredura de dado pessoal NÃO lê. Os dois primeiros são os arquivos que descrevem os
 * próprios padrões e os casos sintéticos do teste: varrê-los produziria achado sobre a ferramenta.
 */
const NAO_VARRER = [
  /^scripts\/lib\/auditoria\/lgpd\.ts$/,
  /^tests\/unit\/auditoria-lgpd\.test\.ts$/,
  /^node_modules\//,
  /^package-lock\.json$/,
  /^public\//,
  /\.(png|jpg|jpeg|gif|webp|ico|svg|woff2?|pdf|zip|kmz|xlsx?)$/i,
];

function arquivosRastreados(): string[] {
  const saida = spawnSync("git", ["ls-files"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (saida.status !== 0) throw new Error(`git ls-files falhou: ${saida.stderr}`);
  return saida.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((f) => !NAO_VARRER.some((re) => re.test(f)))
    .sort();
}

function varrerDadosPessoais(): Achado[] {
  const achados: Achado[] = [];
  for (const arquivo of arquivosRastreados()) {
    const absoluto = path.join(ROOT, arquivo);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(absoluto);
    } catch {
      continue;
    }
    if (!stat.isFile() || stat.size > 4_000_000) continue;
    achados.push(...varrerConteudo(fs.readFileSync(absoluto, "utf8"), arquivo));
  }
  return achados;
}

/* ------------------------------------------------------------------ */
/* Verificações que já existem no projeto                              */
/* ------------------------------------------------------------------ */

/**
 * O lint editorial roda EM PROCESSO, sobre o corpus já carregado: rodar `npm run data:lint` como
 * subprocesso releria e revalidaria os cinco mil arquivos de graça. A regra de bloqueio é a mesma
 * de `scripts/validate-data.ts` — erro sempre bloqueia, aviso em registro publicado bloqueia no
 * modo estrito.
 */
function achadosDoLint(issues: ReturnType<typeof lintCorpus>): {
  achados: Achado[];
  estrito: StatusVerificacao;
} {
  const gravidadePorNivel: Record<string, Gravidade> = {
    error: "alta",
    warning: "media",
    info: "baixa",
  };
  const achados = issues.map((i) => {
    const arquivo = `data/${i.file}`;
    const gravidade: Gravidade =
      i.level === "warning" && i.published === false ? "baixa" : gravidadePorNivel[i.level];
    return novoAchado({
      categoria: `lint-${i.level === "error" ? "erro" : i.level === "warning" ? "aviso" : "info"}`,
      gravidade,
      arquivo,
      registro: path.basename(i.file).replace(/\.ya?ml$/, ""),
      mensagem: i.message,
    });
  });

  const erros = issues.filter((i) => i.level === "error").length;
  const avisosBloqueantes = issues.filter(
    (i) => i.level === "warning" && i.published !== false,
  ).length;
  const bloqueia = erros > 0 || avisosBloqueantes > 0;
  return {
    achados,
    estrito: {
      nome: "data:lint --strict",
      comando: "em processo (loadCorpus + lintCorpus)",
      status: bloqueia ? "falhou" : "ok",
      codigo: bloqueia ? 1 : 0,
    },
  };
}

function rodarComando(
  nome: string,
  comando: string,
): { status: StatusVerificacao; achados: Achado[] } {
  log(`· ${nome}: ${comando}`);
  const r = spawnSync(comando, {
    cwd: ROOT,
    shell: true,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const codigo = r.status ?? 1;
  const status: StatusVerificacao = {
    nome,
    comando,
    status: codigo === 0 ? "ok" : "falhou",
    codigo,
  };
  if (codigo === 0) return { status, achados: [] };

  /*
   * Só as últimas linhas, e só do que a ferramenta imprimiu sobre o próprio fracasso. O relatório
   * circula por Telegram: despejar a saída inteira aqui é como colar o acervo no canal.
   */
  const cauda = `${r.stdout ?? ""}\n${r.stderr ?? ""}`
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .slice(-5)
    .join(" | ")
    .slice(0, 500);
  return {
    status,
    achados: [
      novoAchado({
        categoria: "verificacao",
        gravidade: "alta",
        arquivo: "package.json",
        mensagem: `"${comando}" terminou com código ${codigo}: ${cauda}`,
      }),
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Link rot                                                            */
/* ------------------------------------------------------------------ */

function lerCache(caminho: string | undefined): CacheDeLinks {
  if (!caminho) return cacheVazio();
  try {
    const bruto = JSON.parse(fs.readFileSync(caminho, "utf8")) as CacheDeLinks;
    return bruto?.versao === 1 && bruto.links ? bruto : cacheVazio();
  } catch {
    return cacheVazio();
  }
}

function gravarCache(caminho: string | undefined, cache: CacheDeLinks): void {
  if (!caminho) return;
  fs.mkdirSync(path.dirname(path.resolve(caminho)), { recursive: true });
  fs.writeFileSync(caminho, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

/* ------------------------------------------------------------------ */
/* Execução                                                            */
/* ------------------------------------------------------------------ */

async function principal(): Promise<void> {
  const inicio = Date.now();
  const hoje = new Date().toISOString().slice(0, 10);

  log("· carregando o acervo (inclusive rascunhos)");
  const { corpus, issues } = loadCorpus({ dataDir: path.join(ROOT, "data"), includeDrafts: true });

  const achados: Achado[] = [];
  const verificacoes: StatusVerificacao[] = [];

  log("· lint editorial");
  const lint = achadosDoLint([...issues, ...lintCorpus(corpus)]);
  achados.push(...lint.achados);
  verificacoes.push(lint.estrito);

  log("· integridade referencial e órfãos");
  achados.push(...verificarIntegridade(corpus));

  log("· datas impossíveis");
  achados.push(...verificarDatas(corpus, hoje));

  log("· duplicidade provável");
  achados.push(...verificarDuplicidade(corpus));

  log("· dado pessoal (valores nunca saem mascarados daqui)");
  achados.push(...varrerDadosPessoais());

  let resumoLinks: Relatorio["resumo"]["links"];
  if (semRede) {
    verificacoes.push({ nome: "link rot", status: "pulada" });
    log("· link rot: pulado (--sem-rede)");
  } else {
    const alvos: AlvoDeLink[] = [];
    for (const s of corpus.sources) {
      const arquivo = `data/sources/${s.id}.yaml`;
      if (s.url) alvos.push({ url: s.url, campo: "url", registro: s.id, arquivo });
      if (s.archive_url)
        alvos.push({ url: s.archive_url, campo: "archive_url", registro: s.id, arquivo });
    }
    log(`· link rot: ${alvos.length} endereço(s), teto de ${limiteDeLinks} por execução`);
    const cache = lerCache(arquivoDeEstado);
    const r = await verificarLinks(alvos, cache, { limite: limiteDeLinks });
    achados.push(...r.achados);
    resumoLinks = r.resumo;
    gravarCache(arquivoDeEstado, r.cache);
    verificacoes.push({ nome: "link rot", status: "ok" });
  }

  if (semVerificacoes) {
    for (const nome of ["testes", "build", "segredos"])
      verificacoes.push({ nome, status: "pulada" });
    log("· testes, build e segredos: pulados (--sem-verificacoes)");
  } else {
    for (const [nome, comando] of [
      ["segredos", "npm run scan:secrets"],
      ["testes", "npx vitest run"],
      ["build", "npm run build"],
    ] as const) {
      const r = rodarComando(nome, comando);
      verificacoes.push(r.status);
      achados.push(...r.achados);
    }
  }

  const ordenados = ordenarAchados(achados);
  const porGravidade: Record<Gravidade, number> = { alta: 0, media: 0, baixa: 0 };
  const porCategoria: Record<string, number> = {};
  for (const a of ordenados) {
    porGravidade[a.gravidade]++;
    porCategoria[a.categoria] = (porCategoria[a.categoria] ?? 0) + 1;
  }

  const relatorio: Relatorio = {
    gerado_em: new Date().toISOString(),
    resumo: {
      achados: ordenados.length,
      por_gravidade: porGravidade,
      por_categoria: Object.fromEntries(
        Object.entries(porCategoria).sort(([a], [b]) => a.localeCompare(b)),
      ),
      registros: Object.fromEntries(
        Object.entries(corpus)
          .filter((par): par is [string, unknown[]] => Array.isArray(par[1]))
          .map(([colecao, lista]) => [colecao, lista.length] as const)
          .sort(([a], [b]) => a.localeCompare(b)),
      ),
      verificacoes,
      links: resumoLinks,
    },
    achados: ordenados,
  };

  const json = JSON.stringify(relatorio, null, 2);
  if (arquivoDeSaida) {
    fs.mkdirSync(path.dirname(path.resolve(arquivoDeSaida)), { recursive: true });
    fs.writeFileSync(arquivoDeSaida, json + "\n", "utf8");
    log(`· relatório em ${arquivoDeSaida}`);
  }
  if (comoJson) {
    process.stdout.write(json + "\n");
  } else if (!arquivoDeSaida) {
    process.stdout.write(resumoLegivel(relatorio) + "\n");
  }
  log(`· concluído em ${Math.round((Date.now() - inicio) / 1000)}s`);
}

function resumoLegivel(r: Relatorio): string {
  const linhas = [
    `Auditoria do acervo — ${r.gerado_em}`,
    `${r.resumo.achados} achado(s): ${r.resumo.por_gravidade.alta} alta, ${r.resumo.por_gravidade.media} média, ${r.resumo.por_gravidade.baixa} baixa`,
    "",
    "Por categoria:",
    ...Object.entries(r.resumo.por_categoria).map(([k, v]) => `  ${k}: ${v}`),
    "",
    "Verificações:",
    ...r.resumo.verificacoes.map((v) => `  ${v.nome}: ${v.status}`),
    "",
    "Gravidade alta:",
    ...(r.achados
      .filter((a) => a.gravidade === "alta")
      .slice(0, 40)
      .map(
        (a) => `  [${a.categoria}] ${a.arquivo}${a.linha ? `:${a.linha}` : ""} — ${a.mensagem}`,
      ) || []),
  ];
  return linhas.join("\n");
}

principal().catch((e) => {
  log(`✖ a auditoria falhou: ${(e as Error).stack ?? e}`);
  process.exit(2);
});
