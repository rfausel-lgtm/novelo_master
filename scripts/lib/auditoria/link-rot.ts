import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { normalizarUrl } from "./duplicidade";
import { novoAchado, type Achado, type ResumoLinks } from "./tipos";

/**
 * Link rot nas URLs de `data/sources`.
 *
 * ## Bloqueio não é morte
 *
 * Metade dos veículos brasileiros responde 403 a qualquer requisição sem navegador, e vários
 * respondem 429 quando a auditoria passa. Tratar isso como link morto produziria uma lista de
 * centenas de fontes "quebradas" que abrem normalmente no navegador — e uma lista assim não é lida
 * por ninguém. Só 404 e 410 são morte; 401, 403 e 429 são bloqueio, 5xx é indisponibilidade do
 * momento, e ambos entram como baixa, para o editor decidir se vale arquivar a página.
 *
 * ## O cache existe para a rotina caber na noite
 *
 * São mais de mil fontes. URL que respondeu bem há poucos dias não é reconferida; URL que falhou é
 * reconferida sempre, porque é a que pode ter voltado — ou piorado. O estado vive FORA do
 * repositório, no caminho que a máquina que hospeda a rotina passar por flag.
 *
 * ## Só a internet pública
 *
 * As URLs vêm de `data/`, e o schema só exige URL bem formada: uma fonte apontando para
 * `http://localhost:porta` ou para o endereço de metadados da nuvem faria a rotina, que roda na
 * máquina que hospeda outros serviços, bater neles de madrugada. Por isso cada endereço — o pedido e
 * cada salto de redirecionamento, seguido à mão — tem o host resolvido e é recusado sem requisição
 * quando cai em loopback, rede privada, link-local, CGNAT ou multicast. Recusado vira achado, porque
 * fonte do acervo apontando para rede interna é, em si, erro de captura.
 */

export type EstadoDoLink =
  "ok" | "redirecionado" | "morto" | "bloqueado" | "erro-servidor" | "erro-rede" | "recusado";

export interface RegistroDeLink {
  estado: EstadoDoLink;
  /** ISO 8601 da última conferência. */
  em: string;
  status?: number;
  /** Destino final, quando diferente da URL pedida. */
  destino?: string;
  /** Nome do erro, quando não houve resposta. */
  erro?: string;
}

export interface CacheDeLinks {
  versao: 1;
  links: Record<string, RegistroDeLink>;
}

export function cacheVazio(): CacheDeLinks {
  return { versao: 1, links: {} };
}

export interface AlvoDeLink {
  url: string;
  campo: "url" | "archive_url";
  registro: string;
  arquivo: string;
}

export interface OpcoesDeLink {
  concorrencia: number;
  timeoutMs: number;
  tentativas: number;
  /** Teto de conferências por noite; o resto espera a próxima. */
  limite: number;
  /** Dias que um `ok` vale antes de ser reconferido. */
  validadeDias: number;
  agora: Date;
  buscar: typeof fetch;
  /** Endereços IP do host; injetável para teste. */
  resolver: (host: string) => Promise<string[]>;
  userAgent: string;
}

/** Saltos de redirecionamento seguidos antes de desistir. */
const MAX_SALTOS = 5;

async function resolverDns(host: string): Promise<string[]> {
  return (await lookup(host, { all: true, verbatim: true })).map((r) => r.address);
}

function ipv4Interno(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && ip.split(".")[2] === "0") ||
    (a === 198 && (b === 18 || b === 19))
  );
}

/** Loopback, rede privada, link-local, CGNAT, multicast e reservados — v4 e v6. */
export function ipInterno(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return ipv4Interno(ip);
  if (v !== 6) return true;
  const s = ip.toLowerCase();
  const mapeado = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (mapeado) return ipv4Interno(mapeado[1]);
  return (
    s === "::" ||
    s === "::1" ||
    /^f[cd]/.test(s) || // fc00::/7
    /^fe[89ab]/.test(s) || // fe80::/10
    s.startsWith("ff") // multicast
  );
}

/** A URL pode ser buscada? Protocolo http(s) e todo endereço do host na internet pública. */
export async function destinoPermitido(
  url: string,
  resolver: OpcoesDeLink["resolver"],
): Promise<boolean> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost")) return false;
  if (isIP(host)) return !ipInterno(host);
  try {
    const ips = await resolver(host);
    return ips.length > 0 && ips.every((ip) => !ipInterno(ip));
  } catch {
    /* DNS que não resolve não é recusa: a requisição falha adiante como erro de rede. */
    return true;
  }
}

export const USER_AGENT_PADRAO =
  "NoveloMasterAuditoria/1.0 (+https://novelo-master.fausel.adv.br; auditoria de links do acervo)";

export function opcoesPadrao(parcial: Partial<OpcoesDeLink> = {}): OpcoesDeLink {
  return {
    concorrencia: 8,
    timeoutMs: 15_000,
    tentativas: 2,
    limite: 400,
    validadeDias: 14,
    agora: new Date(),
    buscar: fetch,
    resolver: resolverDns,
    userAgent: USER_AGENT_PADRAO,
    ...parcial,
  };
}

/** Classificação pura da resposta: é o coração da regra e é testado sozinho. */
export function classificarResposta(
  status: number,
  urlPedida: string,
  urlFinal: string,
): EstadoDoLink {
  if (status === 404 || status === 410) return "morto";
  if (status === 401 || status === 403 || status === 429) return "bloqueado";
  if (status >= 500) return "erro-servidor";
  if (status >= 200 && status < 400) {
    return normalizarUrl(urlFinal) !== normalizarUrl(urlPedida) ? "redirecionado" : "ok";
  }
  return "erro-servidor";
}

const GRAVIDADE_DO_ESTADO: Record<EstadoDoLink, "alta" | "media" | "baixa" | null> = {
  ok: null,
  redirecionado: "baixa",
  morto: "alta",
  bloqueado: "baixa",
  "erro-servidor": "baixa",
  "erro-rede": "baixa",
  recusado: "media",
};

const EXPLICACAO: Record<Exclude<EstadoDoLink, "ok">, string> = {
  redirecionado:
    "a URL responde, mas leva a outro endereço: confirme se o destino ainda é a mesma peça e atualize a fonte",
  morto: "a URL não existe mais (404/410): registre o archive_url ou substitua a fonte",
  bloqueado:
    "o servidor recusou a requisição automática (401/403/429). Isso NÃO é link morto: confira no navegador",
  "erro-servidor":
    "o servidor respondeu com erro no momento da conferência; pode ser indisponibilidade passageira",
  "erro-rede":
    "não houve resposta (tempo esgotado, DNS ou conexão); pode ser indisponibilidade passageira",
  recusado:
    "a URL (ou um redirecionamento dela) aponta para rede interna ou protocolo que não é http(s); não foi buscada. Fonte pública não mora aí: confira a captura",
};

const REDIRECIONAMENTO = new Set([301, 302, 303, 307, 308]);

class Recusado extends Error {}

/** Uma requisição, seguindo redirecionamentos à mão para validar cada salto. */
async function buscarValidando(
  url: string,
  metodo: "HEAD" | "GET",
  opts: OpcoesDeLink,
): Promise<{ status: number; final: string }> {
  const cabecalhos = { "user-agent": opts.userAgent, accept: "*/*" };
  let atual = url;
  for (let salto = 0; salto <= MAX_SALTOS; salto++) {
    if (!(await destinoPermitido(atual, opts.resolver))) throw new Recusado();
    const resposta = await opts.buscar(atual, {
      method: metodo,
      redirect: "manual",
      headers: cabecalhos,
      signal: AbortSignal.timeout(opts.timeoutMs),
    });
    const local = REDIRECIONAMENTO.has(resposta.status) ? resposta.headers?.get("location") : null;
    if (!local) return { status: resposta.status, final: resposta.url || atual };
    atual = new URL(local, atual).toString();
  }
  throw Object.assign(new Error("redirecionamentos demais"), { name: "RedirectLoop" });
}

/** Uma tentativa: HEAD primeiro, GET quando o servidor não aceita HEAD. */
async function conferirUrl(url: string, opts: OpcoesDeLink): Promise<RegistroDeLink> {
  let ultimoErro = "";

  for (let tentativa = 0; tentativa < opts.tentativas; tentativa++) {
    for (const metodo of ["HEAD", "GET"] as const) {
      try {
        const resposta = await buscarValidando(url, metodo, opts);
        /*
         * HEAD recusado: tenta GET antes de concluir. 405 e 501 dizem "não implemento HEAD", e 403
         * a um HEAD costuma ser a mesma coisa em servidor com filtro — concluir bloqueio aqui
         * marcaria como suspeita uma fonte que abre no GET.
         */
        if (metodo === "HEAD" && [403, 405, 501].includes(resposta.status)) continue;
        const estado = classificarResposta(resposta.status, url, resposta.final);
        return {
          estado,
          em: opts.agora.toISOString(),
          status: resposta.status,
          destino: estado === "redirecionado" ? resposta.final : undefined,
        };
      } catch (e) {
        if (e instanceof Recusado) return { estado: "recusado", em: opts.agora.toISOString() };
        ultimoErro = (e as Error).name;
      }
    }
  }
  return { estado: "erro-rede", em: opts.agora.toISOString(), erro: ultimoErro || undefined };
}

function precisaConferir(registro: RegistroDeLink | undefined, opts: OpcoesDeLink): boolean {
  if (!registro) return true;
  if (registro.estado !== "ok") return true;
  const idade = (opts.agora.getTime() - new Date(registro.em).getTime()) / 86_400_000;
  return !(idade >= 0 && idade < opts.validadeDias);
}

/** Executa `tarefas` com no máximo `n` em voo. */
async function comConcorrencia<T>(
  itens: T[],
  n: number,
  tarefa: (item: T) => Promise<void>,
): Promise<void> {
  let proximo = 0;
  const trabalhador = async () => {
    while (proximo < itens.length) await tarefa(itens[proximo++]);
  };
  await Promise.all(Array.from({ length: Math.min(n, itens.length) }, trabalhador));
}

export async function verificarLinks(
  alvos: AlvoDeLink[],
  cache: CacheDeLinks,
  parcial: Partial<OpcoesDeLink> = {},
): Promise<{ achados: Achado[]; resumo: ResumoLinks; cache: CacheDeLinks }> {
  const opts = opcoesPadrao(parcial);
  const novo: CacheDeLinks = { versao: 1, links: { ...cache.links } };

  /* Ordem estável, e o que está há mais tempo sem conferência vai primeiro. */
  const ordenados = [...alvos].sort(
    (a, b) =>
      (novo.links[a.url]?.em ?? "").localeCompare(novo.links[b.url]?.em ?? "") ||
      a.url.localeCompare(b.url),
  );
  const pendentes = ordenados.filter((a) => precisaConferir(novo.links[a.url], opts));
  const aConferir = pendentes.slice(0, opts.limite);
  const urlsUnicas = [...new Set(aConferir.map((a) => a.url))];

  await comConcorrencia(urlsUnicas, opts.concorrencia, async (url) => {
    novo.links[url] = await conferirUrl(url, opts);
  });

  const resumo: ResumoLinks = {
    verificados: urlsUnicas.length,
    do_cache: alvos.length - pendentes.length,
    ok: 0,
    redirecionados: 0,
    mortos: 0,
    bloqueados: 0,
    erro_rede: 0,
    erro_servidor: 0,
    recusados: 0,
    nao_verificados: pendentes.length - aConferir.length,
  };

  const achados: Achado[] = [];
  for (const alvo of alvos) {
    const registro = novo.links[alvo.url];
    if (!registro) continue;
    switch (registro.estado) {
      case "ok":
        resumo.ok++;
        continue;
      case "redirecionado":
        resumo.redirecionados++;
        break;
      case "morto":
        resumo.mortos++;
        break;
      case "bloqueado":
        resumo.bloqueados++;
        break;
      case "erro-servidor":
        resumo.erro_servidor++;
        break;
      case "erro-rede":
        resumo.erro_rede++;
        break;
      case "recusado":
        resumo.recusados++;
        break;
    }
    const gravidade = GRAVIDADE_DO_ESTADO[registro.estado];
    if (!gravidade) continue;
    achados.push(
      novoAchado({
        categoria: "link-rot",
        gravidade,
        arquivo: alvo.arquivo,
        registro: alvo.registro,
        mensagem:
          `${alvo.campo} ${registro.estado}${registro.status ? ` (HTTP ${registro.status})` : ""}: ` +
          EXPLICACAO[registro.estado],
      }),
    );
  }

  return { achados, resumo, cache: novo };
}
