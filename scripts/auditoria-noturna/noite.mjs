#!/usr/bin/env node
/*
 * Segunda metade da auditoria noturna (docs/AUDITORIA_NOTURNA.md): revisão por IA, verificação
 * adversarial, comparação com a noite anterior e aviso no Telegram.
 *
 * Roda NO HOST, fora do contêiner, porque é aqui que o Claude Code está autenticado. Por isso só usa
 * a biblioteca padrão e funciona em Node 20 — não depende do `npm ci` do projeto.
 *
 * O que ele nunca faz: escrever no repositório, commitar, abrir PR, publicar. O Claude Code é chamado
 * só com ferramentas de leitura (Read, Grep, Glob, WebFetch); Bash, Edit e Write ficam proibidos.
 *
 * Uso:
 *   node noite.mjs --data AAAA-MM-DD      a noite inteira
 *   node noite.mjs --aviso "texto"        só manda o texto ao Telegram (usado quando algo quebra)
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE =
  process.env.NOVELO_AUDITORIA_BASE ?? path.join(process.env.HOME ?? "", "novelo-auditoria");
const EST = path.join(BASE, "estado");
const REL = path.join(BASE, "relatorios");

const PRAZO_MIN = Number(process.env.NOVELO_AUDITORIA_PRAZO_MIN ?? 45);
/** Parte final do prazo guardada para a verificação: revisão sem verificação não chega ao editor. */
const RESERVA_VERIFICACAO_MIN = Number(process.env.NOVELO_AUDITORIA_RESERVA_VERIFICACAO_MIN ?? 15);
const REGISTROS_POR_LOTE = Number(process.env.NOVELO_AUDITORIA_LOTE ?? 10);
const CLAUDE = process.env.NOVELO_AUDITORIA_CLAUDE ?? "claude";
const LIMITE_TELEGRAM = 3800;

const args = process.argv.slice(2);
const valorDe = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

/* ------------------------------------------------------------------ */
/* Telegram                                                            */
/* ------------------------------------------------------------------ */

/** Lê uma variável de um arquivo KEY=VALOR sem carregar o resto nem imprimir nada. */
function lerVariavel(arquivo, nome) {
  try {
    for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
      const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linha);
      if (m && m[1] === nome) return m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* arquivo ausente: devolve indefinido */
  }
  return undefined;
}

async function telegram(texto) {
  /* Ensaio: NOVELO_AUDITORIA_SECO=1 imprime em vez de enviar (instalação e teste). */
  if (process.env.NOVELO_AUDITORIA_SECO === "1") {
    console.log(`--- Telegram (seco) ---\n${texto}\n--- fim ---`);
    return;
  }
  const arquivo = process.env.NOVELO_AUDITORIA_TELEGRAM_ENV;
  const token =
    process.env.TELEGRAM_BOT_TOKEN ?? (arquivo && lerVariavel(arquivo, "TELEGRAM_BOT_TOKEN"));
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) throw new Error("Telegram sem TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID");
  const pedacos = [];
  let resto = texto;
  while (resto.length > LIMITE_TELEGRAM) {
    const corte = resto.lastIndexOf("\n", LIMITE_TELEGRAM);
    const ate = corte > 1000 ? corte : LIMITE_TELEGRAM;
    pedacos.push(resto.slice(0, ate));
    resto = resto.slice(ate).replace(/^\n/, "");
  }
  pedacos.push(resto);
  for (const pedaco of pedacos) {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: pedaco, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(20_000),
    });
    // O status basta; a URL tem o token e nunca vai para log.
    if (!r.ok) throw new Error(`Telegram respondeu ${r.status}`);
  }
}

/* ------------------------------------------------------------------ */
/* Máscara de última linha                                             */
/* ------------------------------------------------------------------ */

/**
 * O prompt proíbe transcrever dado pessoal, mas texto de modelo não é garantia. Antes de sair para o
 * Telegram ou para o relatório, todo texto escrito pela IA passa por aqui: e-mail, sequência longa
 * de dígitos com cara de CPF ou telefone vira marcador. Número de processo e CNPJ também são
 * mascarados — perder um número no aviso é barato; o editor abre o registro para ver. Datas ficam,
 * porque achado de data sem a data não se lê. Texto da camada determinística não passa aqui: ele é
 * montado pelo próprio código, e o de dado pessoal já sai sem dígito nenhum.
 */
const DATA_LEGIVEL = /^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/;

function mascarar(texto) {
  return String(texto ?? "")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[e-mail]")
    .replace(/\(\d{2}\)\s?9?\d{4}[-\s]?\d{4}/g, "[número]")
    .replace(/\d[\d.\-/\s]{7,}\d/g, (m) => (DATA_LEGIVEL.test(m) ? m : "[número]"));
}

/* ------------------------------------------------------------------ */
/* Prompts versionados                                                 */
/* ------------------------------------------------------------------ */

function lerPrompt(arquivo) {
  const texto = fs.readFileSync(path.join(REPO, "docs/auditoria", arquivo), "utf8");
  const m = /=== PROMPT ===\s*\n([\s\S]*?)\n=== FIM DO PROMPT ===/.exec(texto);
  if (!m) throw new Error(`${arquivo}: bloco do prompt não encontrado`);
  return m[1];
}

const preencher = (modelo, campos) =>
  Object.entries(campos).reduce((t, [k, v]) => t.split(`{{${k}}}`).join(v), modelo);

/* ------------------------------------------------------------------ */
/* Claude Code em modo headless, só leitura                            */
/* ------------------------------------------------------------------ */

function chamarClaude(prompt, timeoutMs) {
  return new Promise((resolve) => {
    const filho = spawn(
      CLAUDE,
      [
        "-p",
        "--output-format",
        "json",
        "--no-session-persistence",
        "--permission-mode",
        "dontAsk",
        "--allowedTools",
        "Read,Grep,Glob,WebFetch",
        "--disallowedTools",
        "Bash,Edit,Write,NotebookEdit,Task",
        "--strict-mcp-config",
        "--mcp-config",
        '{"mcpServers":{}}',
      ],
      { cwd: REPO, env: process.env, stdio: ["pipe", "pipe", "pipe"] },
    );
    let saida = "";
    let erro = "";
    const relogio = setTimeout(() => filho.kill("SIGKILL"), timeoutMs);
    filho.stdout.on("data", (d) => (saida += d));
    filho.stderr.on("data", (d) => (erro += d));
    filho.on("close", (codigo) => {
      clearTimeout(relogio);
      resolve({ codigo, saida, erro: erro.slice(-500) });
    });
    filho.stdin.end(prompt);
  });
}

/** O `result` do --output-format json, com o objeto JSON que o prompt pede dentro dele. */
function extrairJson(saidaDoClaude) {
  let texto;
  try {
    texto = JSON.parse(saidaDoClaude).result ?? "";
  } catch {
    return null;
  }
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio < 0 || fim <= inicio) return null;
  try {
    return JSON.parse(texto.slice(inicio, fim + 1));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* A noite                                                             */
/* ------------------------------------------------------------------ */

const TIPOS = new Set([
  "afirmacao-sem-lastro",
  "classificacao-incompativel",
  "ligacao-sem-lastro",
  "atribuicao-de-crime",
  "exagero-editorial",
  "dado-pessoal",
]);

/** Descarte por construção: achado sem os campos que permitem conferi-lo não segue adiante. */
function achadoValido(a, idsDoLote) {
  if (!a || typeof a !== "object") return false;
  if (!idsDoLote.has(a.registro_id) || !TIPOS.has(a.tipo)) return false;
  if (!a.problema || !a.fonte_id) return false;
  if (a.tipo === "dado-pessoal") {
    a.trecho_literal = "";
    return true;
  }
  if (a.verificacao_da_fonte === "abri") return Boolean(a.trecho_literal && a.fonte_url);
  if (a.verificacao_da_fonte === "nao_verificei") {
    a.gravidade = "baixa";
    return true;
  }
  return false;
}

function lerJson(arquivo, padrao) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, "utf8"));
  } catch {
    return padrao;
  }
}

function relatorioAnterior(data) {
  const anteriores = fs
    .readdirSync(EST)
    .filter((f) => /^det-\d{4}-\d{2}-\d{2}\.json$/.test(f) && f < `det-${data}.json`)
    .sort();
  return anteriores.length ? lerJson(path.join(EST, anteriores.at(-1)), null) : null;
}

async function noite(data) {
  const inicio = Date.now();
  const prazo = inicio + PRAZO_MIN * 60_000;
  const fimDaRevisao = prazo - RESERVA_VERIFICACAO_MIN * 60_000;
  const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`);

  const det = lerJson(path.join(EST, `det-${data}.json`), null);
  const sel = lerJson(path.join(EST, `sel-${data}.json`), null);
  if (!det || !sel) throw new Error("faltam os arquivos da camada determinística");

  /* 1. Revisão, em lotes: cada chamada é uma sessão nova e curta. */
  const promptRevisao = lerPrompt("PROMPT_REVISAO.md");
  const registros = sel.registros ?? [];
  const achados = [];
  const revisados = new Set();
  const falhas = [];
  for (let i = 0; i < registros.length; i += REGISTROS_POR_LOTE) {
    const restante = fimDaRevisao - Date.now();
    if (restante < 3 * 60_000) break;
    const lote = registros.slice(i, i + REGISTROS_POR_LOTE);
    const ids = new Set(lote.map((r) => r.id));
    const doLote = det.achados.filter((a) => a.registro && ids.has(a.registro));
    const prompt = preencher(promptRevisao, {
      LISTA_DE_REGISTROS: lote.map((r) => `- ${r.id} (${r.arquivo}) — ${r.motivo}`).join("\n"),
      RELATORIO_DETERMINISTICO: JSON.stringify({ resumo: det.resumo, achados: doLote }, null, 1),
    });
    log(`revisão: lote ${i / REGISTROS_POR_LOTE + 1} (${lote.length} registros)`);
    const r = await chamarClaude(prompt, Math.min(restante, 15 * 60_000));
    const json = r.codigo === 0 ? extrairJson(r.saida) : null;
    if (!json) {
      falhas.push(`lote ${i / REGISTROS_POR_LOTE + 1}: saída inválida (código ${r.codigo})`);
      continue;
    }
    for (const id of json.registros_revisados ?? []) if (ids.has(id)) revisados.add(id);
    for (const a of json.achados ?? []) if (achadoValido(a, ids)) achados.push(a);
  }
  const revisaoCompleta = revisados.size > 0 && registros.every((r) => revisados.has(r.id));

  /* 2. Verificação adversarial: um achado por chamada, sem ver os outros. */
  const promptVerificacao = lerPrompt("PROMPT_VERIFICACAO.md");
  const verificados = [];
  let semTempo = 0;
  for (const a of achados) {
    const restante = prazo - Date.now();
    if (restante < 2 * 60_000) {
      semTempo++;
      continue;
    }
    const arquivo = path.join(REPO, a.arquivo ?? "");
    const registro =
      arquivo.startsWith(path.join(REPO, "data")) && fs.existsSync(arquivo)
        ? fs.readFileSync(arquivo, "utf8")
        : "(arquivo do registro não encontrado)";
    const r = await chamarClaude(
      preencher(promptVerificacao, { ACHADO: JSON.stringify(a, null, 1), REGISTRO: registro }),
      Math.min(restante, 6 * 60_000),
    );
    const v = r.codigo === 0 ? extrairJson(r.saida) : null;
    if (!v || !["CONFIRMADO", "DUVIDOSO", "DESCARTADO"].includes(v.veredito)) {
      falhas.push(`verificação de ${a.registro_id}: saída inválida`);
      continue;
    }
    // Fonte que não abriu não confirma nada, diga o modelo o que disser.
    if (v.veredito === "CONFIRMADO" && v.fonte_aberta === false) v.veredito = "DUVIDOSO";
    verificados.push({ ...a, veredito: v.veredito, justificativa: v.justificativa ?? "" });
  }
  const entregues = verificados.filter((a) => a.veredito !== "DESCARTADO");
  const descartados = verificados.length - entregues.length;

  /* 3. O ponteiro da amostra só anda se a revisão cobriu a seleção inteira. */
  const provisorio = path.join(EST, "selecao-provisoria.json");
  if (revisaoCompleta && fs.existsSync(provisorio)) {
    fs.renameSync(provisorio, path.join(EST, "estado.json"));
  }

  /* 4. Camada determinística: só o que é novo desde a noite anterior. */
  const anterior = relatorioAnterior(data);
  const idsAnteriores = new Set((anterior?.achados ?? []).map((a) => a.id));
  const idsDeHoje = new Set(det.achados.map((a) => a.id));
  const novos = anterior ? det.achados.filter((a) => !idsAnteriores.has(a.id)) : [];
  const resolvidos = anterior ? [...idsAnteriores].filter((id) => !idsDeHoje.has(id)).length : 0;
  const verificacoesFalhas = (det.resumo.verificacoes ?? []).filter((v) => v.status === "falhou");

  /* 5. Relatório completo em arquivo, resumo no Telegram. */
  const g = det.resumo.por_gravidade;
  const linhas = [];
  linhas.push(`Auditoria noturna — ${data}`);
  linhas.push("");
  if (verificacoesFalhas.length)
    linhas.push(`⚠ Verificação que falhou: ${verificacoesFalhas.map((v) => v.nome).join(", ")}`);
  linhas.push(
    `Mecânica: ${det.resumo.achados} achados no acervo (${g.alta} alta, ${g.media} média, ${g.baixa} baixa).`,
  );
  if (!anterior) {
    linhas.push("Primeira noite: esta é a linha de base. A partir de amanhã, só o que for novo.");
  } else {
    linhas.push(`Desde ontem: ${novos.length} novo(s), ${resolvidos} resolvido(s).`);
    for (const a of novos.filter((x) => x.gravidade !== "baixa").slice(0, 15))
      linhas.push(`• [${a.gravidade}] ${a.categoria} — ${a.registro ?? a.arquivo}: ${a.mensagem}`);
    const restantes = novos.filter((x) => x.gravidade !== "baixa").length - 15;
    if (restantes > 0) linhas.push(`  … e mais ${restantes} no relatório.`);
  }
  linhas.push("");
  linhas.push(
    `Revisão por IA: ${revisados.size}/${registros.length} registros revisados, ` +
      `${achados.length} achado(s) levantado(s), ${descartados} derrubado(s) na verificação, ` +
      `${entregues.length} para você.` +
      (semTempo
        ? ` ${semTempo} ficaram sem verificação por falta de tempo e não foram enviados.`
        : ""),
  );
  for (const a of entregues) {
    linhas.push("");
    linhas.push(
      `${a.veredito === "CONFIRMADO" ? "✔ CONFIRMADO" : "? DUVIDOSO"} · ${a.tipo} · ${a.gravidade}`,
    );
    linhas.push(`${a.registro_id} (${a.campo ?? "?"})`);
    linhas.push(mascarar(a.problema));
    if (a.trecho_literal) linhas.push(`Fonte ${a.fonte_id}: “${mascarar(a.trecho_literal)}”`);
    if (a.justificativa) linhas.push(`Verificador: ${mascarar(a.justificativa)}`);
  }
  if (falhas.length) {
    linhas.push("");
    linhas.push(`Falhas da etapa de IA: ${falhas.length} (detalhes no relatório).`);
  }
  if (!revisaoCompleta) linhas.push("A amostra não avançou: a mesma fatia volta amanhã.");
  linhas.push("");
  linhas.push(`Relatório completo: ${path.join(REL, `${data}.md`)}`);

  fs.mkdirSync(REL, { recursive: true });
  const detalhe = [
    ...linhas,
    "",
    "## Novos achados mecânicos (todos)",
    ...novos.map(
      (a) =>
        `- [${a.gravidade}] ${a.categoria} — ${a.arquivo}${a.linha ? `:${a.linha}` : ""}: ${a.mensagem}`,
    ),
    "",
    "## Falhas da etapa de IA",
    ...falhas.map((f) => `- ${f}`),
  ].join("\n");
  fs.writeFileSync(path.join(REL, `${data}.md`), detalhe);
  fs.writeFileSync(
    path.join(REL, `${data}-ia.json`),
    JSON.stringify({ revisados: [...revisados], achados: verificados, falhas }, null, 1),
  );

  const houveAlgo =
    !anterior || novos.length || entregues.length || falhas.length || verificacoesFalhas.length;
  if (houveAlgo) await telegram(linhas.join("\n"));
  else
    await telegram(
      `Auditoria noturna — ${data}: nada novo. ${revisados.size} registros revisados pela IA.`,
    );
  log(`concluído em ${Math.round((Date.now() - inicio) / 60_000)} min`);
}

const aviso = valorDe("--aviso");
const data = valorDe("--data");
try {
  if (aviso) await telegram(aviso);
  else if (data && /^\d{4}-\d{2}-\d{2}$/.test(data)) await noite(data);
  else {
    console.error("uso: noite.mjs --data AAAA-MM-DD | --aviso texto");
    process.exit(2);
  }
} catch (e) {
  console.error(`✖ ${e.message}`);
  process.exit(1);
}
