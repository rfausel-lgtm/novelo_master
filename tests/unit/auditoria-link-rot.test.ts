import { describe, it, expect } from "vitest";
import {
  cacheVazio,
  classificarResposta,
  ipInterno,
  verificarLinks,
  type AlvoDeLink,
  type CacheDeLinks,
} from "../../scripts/lib/auditoria/link-rot";

const alvo = (url: string): AlvoDeLink => ({
  url,
  campo: "url",
  registro: "src-x",
  arquivo: "data/sources/src-x.yaml",
});

/** DNS de mentira: todo host resolve para um IP público, salvo os nomeados aqui. */
const publico = async (host: string) => (host === "interno" ? ["10.0.0.5"] : ["93.184.216.34"]);

const verificar = (
  alvos: AlvoDeLink[],
  cache: CacheDeLinks,
  o: Parameters<typeof verificarLinks>[2] = {},
) => verificarLinks(alvos, cache, { resolver: publico, ...o });

/** `fetch` de mentira: nenhum teste desta suíte toca a rede. */
function falsoFetch(respostas: Record<string, { status: number; url?: string } | "erro">) {
  const chamadas: { url: string; metodo: string; userAgent?: string }[] = [];
  const buscar = (async (url: string, init?: RequestInit) => {
    chamadas.push({
      url,
      metodo: init?.method ?? "GET",
      userAgent: (init?.headers as Record<string, string>)?.["user-agent"],
    });
    const r = respostas[url];
    if (!r || r === "erro") throw Object.assign(new Error("timeout"), { name: "TimeoutError" });
    return { status: r.status, url: r.url ?? url } as Response;
  }) as unknown as typeof fetch;
  return { buscar, chamadas };
}

describe("auditoria — classificação da resposta", () => {
  it("404 e 410 são morte", () => {
    expect(classificarResposta(404, "https://a/x", "https://a/x")).toBe("morto");
    expect(classificarResposta(410, "https://a/x", "https://a/x")).toBe("morto");
  });

  it("403 e 429 são bloqueio, nunca morte", () => {
    expect(classificarResposta(403, "https://a/x", "https://a/x")).toBe("bloqueado");
    expect(classificarResposta(429, "https://a/x", "https://a/x")).toBe("bloqueado");
    expect(classificarResposta(401, "https://a/x", "https://a/x")).toBe("bloqueado");
  });

  it("5xx é indisponibilidade do momento", () => {
    expect(classificarResposta(503, "https://a/x", "https://a/x")).toBe("erro-servidor");
  });

  it("destino diferente é redirecionamento; diferença cosmética não é", () => {
    expect(classificarResposta(200, "https://a/x", "https://b/y")).toBe("redirecionado");
    expect(classificarResposta(200, "https://a/x", "https://www.a/x/")).toBe("ok");
  });
});

describe("auditoria — link rot", () => {
  it("não trata bloqueio como link morto e ainda assim reporta, com gravidade baixa", async () => {
    const { buscar } = falsoFetch({ "https://veiculo/x": { status: 403 } });
    const r = await verificar([alvo("https://veiculo/x")], cacheVazio(), {
      buscar,
      tentativas: 1,
    });
    expect(r.resumo.mortos).toBe(0);
    expect(r.resumo.bloqueados).toBe(1);
    expect(r.achados[0].gravidade).toBe("baixa");
    expect(r.achados[0].mensagem).toContain("NÃO é link morto");
  });

  it("404 é alta e diz o que fazer", async () => {
    const { buscar } = falsoFetch({ "https://veiculo/x": { status: 404 } });
    const r = await verificar([alvo("https://veiculo/x")], cacheVazio(), {
      buscar,
      tentativas: 1,
    });
    expect(r.achados[0].gravidade).toBe("alta");
    expect(r.achados[0].mensagem).toContain("archive_url");
  });

  it("200 não vira achado", async () => {
    const { buscar } = falsoFetch({ "https://veiculo/x": { status: 200 } });
    const r = await verificar([alvo("https://veiculo/x")], cacheVazio(), {
      buscar,
      tentativas: 1,
    });
    expect(r.achados).toEqual([]);
    expect(r.resumo.ok).toBe(1);
  });

  it("HEAD recusado cai para GET antes de concluir bloqueio", async () => {
    const chamadas: string[] = [];
    const buscar = (async (url: string, init?: RequestInit) => {
      chamadas.push(init?.method ?? "GET");
      if (init?.method === "HEAD") return { status: 405, url } as Response;
      return { status: 200, url } as Response;
    }) as unknown as typeof fetch;
    const r = await verificar([alvo("https://veiculo/x")], cacheVazio(), {
      buscar,
      tentativas: 1,
    });
    expect(chamadas).toEqual(["HEAD", "GET"]);
    expect(r.achados).toEqual([]);
  });

  it("sem resposta é erro de rede, não morte", async () => {
    const { buscar } = falsoFetch({ "https://veiculo/x": "erro" });
    const r = await verificar([alvo("https://veiculo/x")], cacheVazio(), {
      buscar,
      tentativas: 1,
    });
    expect(r.resumo.erro_rede).toBe(1);
    expect(r.resumo.mortos).toBe(0);
    expect(r.achados[0].gravidade).toBe("baixa");
  });

  it("identifica o projeto no user-agent", async () => {
    const { buscar, chamadas } = falsoFetch({ "https://veiculo/x": { status: 200 } });
    await verificar([alvo("https://veiculo/x")], cacheVazio(), { buscar, tentativas: 1 });
    expect(chamadas[0].userAgent).toContain("NoveloMasterAuditoria");
  });

  it("o cache poupa o que respondeu bem há pouco", async () => {
    const cache: CacheDeLinks = {
      versao: 1,
      links: { "https://veiculo/x": { estado: "ok", em: "2026-09-16T02:00:00.000Z", status: 200 } },
    };
    const { buscar, chamadas } = falsoFetch({ "https://veiculo/x": { status: 200 } });
    const r = await verificar([alvo("https://veiculo/x")], cache, {
      buscar,
      agora: new Date("2026-09-17T02:00:00.000Z"),
    });
    expect(chamadas).toHaveLength(0);
    expect(r.resumo.do_cache).toBe(1);
  });

  it("o que falhou é reconferido na noite seguinte", async () => {
    const cache: CacheDeLinks = {
      versao: 1,
      links: {
        "https://veiculo/x": { estado: "morto", em: "2026-09-16T02:00:00.000Z", status: 404 },
      },
    };
    const { buscar, chamadas } = falsoFetch({ "https://veiculo/x": { status: 200 } });
    const r = await verificar([alvo("https://veiculo/x")], cache, {
      buscar,
      tentativas: 1,
      agora: new Date("2026-09-17T02:00:00.000Z"),
    });
    expect(chamadas.length).toBeGreaterThan(0);
    expect(r.achados).toEqual([]);
  });

  it("o teto por execução deixa o resto para a próxima noite", async () => {
    const alvos = [alvo("https://a/1"), alvo("https://a/2"), alvo("https://a/3")];
    const { buscar, chamadas } = falsoFetch({
      "https://a/1": { status: 200 },
      "https://a/2": { status: 200 },
      "https://a/3": { status: 200 },
    });
    const r = await verificar(alvos, cacheVazio(), { buscar, limite: 2, tentativas: 1 });
    expect(chamadas).toHaveLength(2);
    expect(r.resumo.nao_verificados).toBe(1);
  });
});

describe("auditoria — link rot só busca a internet pública", () => {
  const semBusca = (() => {
    throw new Error("não deveria ter buscado");
  }) as unknown as typeof fetch;

  it("classifica loopback, rede privada, link-local e CGNAT como internos", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.20.0.1",
      "192.168.0.10",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ])
      expect(ipInterno(ip), ip).toBe(true);
    for (const ip of ["93.184.216.34", "8.8.8.8", "172.32.0.1", "2606:4700::1111"])
      expect(ipInterno(ip), ip).toBe(false);
  });

  it("recusa localhost, IP interno, host que resolve para rede interna e protocolo estranho sem fazer requisição", async () => {
    for (const url of [
      "http://localhost:6379/",
      "http://127.0.0.1/x",
      "http://169.254.169.254/latest/meta-data/",
      "http://interno/x",
      "file:///etc/passwd",
      "ftp://veiculo/x",
    ]) {
      const r = await verificar([alvo(url)], cacheVazio(), { buscar: semBusca, tentativas: 1 });
      expect(r.resumo.recusados, url).toBe(1);
      expect(r.achados[0].gravidade).toBe("media");
    }
  });

  it("recusa redirecionamento de host público para rede interna", async () => {
    const chamadas: string[] = [];
    const buscar = (async (url: string) => {
      chamadas.push(url);
      return {
        status: 302,
        url,
        headers: new Headers({ location: "http://169.254.169.254/latest/meta-data/" }),
      } as Response;
    }) as unknown as typeof fetch;
    const r = await verificar([alvo("https://veiculo/x")], cacheVazio(), { buscar, tentativas: 1 });
    expect(chamadas).toEqual(["https://veiculo/x"]);
    expect(r.resumo.recusados).toBe(1);
  });

  it("segue redirecionamento público e o registra como tal", async () => {
    const buscar = (async (url: string) =>
      url === "https://veiculo/x"
        ? ({ status: 301, url, headers: new Headers({ location: "/nova" }) } as Response)
        : ({ status: 200, url, headers: new Headers() } as Response)) as unknown as typeof fetch;
    const r = await verificar([alvo("https://veiculo/x")], cacheVazio(), { buscar, tentativas: 1 });
    expect(r.resumo.redirecionados).toBe(1);
    expect(r.cache.links["https://veiculo/x"].destino).toBe("https://veiculo/nova");
  });
});
