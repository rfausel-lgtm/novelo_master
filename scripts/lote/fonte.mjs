// Cache de fontes SEM modelo: baixa a página, extrai o texto literal e grava hash e data.
// Uso:
//   node scripts/lote/fonte.mjs <url>                    baixa e guarda (HTML ou PDF via pdftotext)
//   node scripts/lote/fonte.mjs <url> --texto arq.txt    registra texto capturado no navegador (403, paywall)
//   node scripts/lote/fonte.mjs --achar "trecho" [url]   procura o trecho LITERAL nas fontes em cache
//   node scripts/lote/fonte.mjs --lista                  lista o cache
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CACHE, cacheKey, norm, sha } from "./_util.mjs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const ENT = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
};

function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}

export function htmlToText(html) {
  const s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|head)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/blockquote|\/section|\/article)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decode(s)
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

const first = (html, res) => {
  for (const re of res) {
    const m = html.match(re);
    if (m) return decode(m[1]).trim();
  }
  return null;
};

function meta(html) {
  return {
    title: first(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]),
    published: first(html, [
      /property=["']article:published_time["'][^>]*content=["']([^"']+)/i,
      /content=["']([^"']+)["'][^>]*property=["']article:published_time["']/i,
      /"datePublished"\s*:\s*"([^"]+)"/i,
      /<time[^>]*datetime=["']([^"']+)/i,
    ]),
  };
}

function save(url, text, extra) {
  fs.mkdirSync(CACHE, { recursive: true });
  const key = cacheKey(url);
  const m = {
    url,
    retrieved_at: new Date().toISOString(),
    sha256_text: sha(text),
    chars: text.length,
    ...extra,
  };
  fs.writeFileSync(path.join(CACHE, `${key}.txt`), text, "utf8");
  fs.writeFileSync(path.join(CACHE, `${key}.json`), JSON.stringify(m, null, 1), "utf8");
  return m;
}

async function baixar(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/pdf,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(40000),
  });
  const ct = r.headers.get("content-type") || "";
  const buf = Buffer.from(await r.arrayBuffer());
  if (/pdf/i.test(ct) || /\.pdf(\?|$)/i.test(url)) {
    const tmp = path.join(os.tmpdir(), `fonte-${Date.now()}.pdf`);
    fs.writeFileSync(tmp, buf);
    try {
      const text = execFileSync("pdftotext", ["-layout", tmp, "-"], {
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
      });
      return {
        status: r.status,
        text,
        extra: { status: r.status, tipo: "pdf", sha256_arquivo: sha(buf), final_url: r.url },
      };
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  }
  const html = buf.toString("utf8");
  return {
    status: r.status,
    text: htmlToText(html),
    extra: {
      status: r.status,
      tipo: "html",
      sha256_arquivo: sha(buf),
      final_url: r.url,
      ...meta(html),
    },
  };
}

function lista() {
  if (!fs.existsSync(CACHE)) return [];
  return fs
    .readdirSync(CACHE)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(CACHE, f), "utf8")));
}

function achar(trecho, url) {
  const alvo = norm(trecho);
  let n = 0;
  for (const m of lista()) {
    if (url && m.url.replace(/\/$/, "") !== url.replace(/\/$/, "")) continue;
    const t = fs.readFileSync(path.join(CACHE, `${cacheKey(m.url)}.txt`), "utf8");
    const nt = norm(t);
    const i = nt.indexOf(alvo);
    if (i >= 0) {
      n++;
      console.log(
        `ENCONTRADO em ${m.url}\n   …${nt.slice(Math.max(0, i - 60), i + alvo.length + 60)}…`,
      );
    }
  }
  if (!n)
    console.log(
      "NÃO ENCONTRADO em nenhuma fonte em cache (confira se a URL foi baixada com fonte.mjs).",
    );
  process.exit(n ? 0 : 1);
}

const a = process.argv.slice(2);
const flag = (f) => (a.includes(f) ? a[a.indexOf(f) + 1] : null);
if (a.includes("--lista")) {
  for (const m of lista())
    console.log(`${m.status ?? "-"}\t${m.chars}\t${m.retrieved_at.slice(0, 16)}\t${m.url}`);
} else if (a.includes("--achar")) {
  achar(
    flag("--achar"),
    a.find((x, i) => /^https?:/.test(x) && a[i - 1] !== "--achar"),
  );
} else if (a[0]) {
  const url = a[0];
  const arq = flag("--texto");
  if (arq) {
    const m = save(url, fs.readFileSync(arq, "utf8"), {
      status: "navegador",
      tipo: "texto-do-navegador",
    });
    console.log(
      `OK (texto do navegador) ${m.chars} chars sha256=${m.sha256_text.slice(0, 16)} ${url}`,
    );
  } else {
    try {
      const r = await baixar(url);
      const m = save(url, r.text, r.extra);
      const aviso =
        r.status >= 400 || r.text.length < 500
          ? "  [ATENÇÃO: bloqueio/paywall provável; use o navegador e --texto]"
          : "";
      console.log(
        `${r.status} ${m.tipo} ${m.chars} chars | título: ${(m.title || "-").slice(0, 90)} | publicado: ${m.published || "-"} | sha256=${m.sha256_text.slice(0, 16)}${aviso}`,
      );
    } catch (e) {
      console.log(`FALHOU: ${e.message}  [use o navegador e --texto]`);
      process.exit(1);
    }
  }
} else {
  console.log('uso: fonte.mjs <url> [--texto arq] | --achar "trecho" [url] | --lista');
}
