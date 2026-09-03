/**
 * Renderizador Markdown → React sem dependências, suficiente para os documentos
 * normativos do repositório (METHODOLOGY.md, EDITORIAL_POLICY.md).
 *
 * Suporta: títulos (#..######), parágrafos, listas (ul/ol, um nível de aninhamento),
 * links, negrito/itálico, código inline, blocos de código, citações, tabelas simples
 * (pipe) e réguas horizontais.
 */
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* AST                                                                 */
/* ------------------------------------------------------------------ */

export type Inline =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type ListItem = { children: Inline[]; sublist?: ListBlock };
export type ListBlock = { type: "list"; ordered: boolean; items: ListItem[] };

export type Block =
  | { type: "heading"; level: number; id: string; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | ListBlock
  | { type: "code"; lang?: string; value: string }
  | { type: "blockquote"; children: Block[] }
  | { type: "table"; header: Inline[][]; rows: Inline[][][] }
  | { type: "hr" };

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}

export function inlineToText(nodes: Inline[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text" || n.type === "code") return n.value;
      return inlineToText(n.children);
    })
    .join("");
}

/* ------------------------------------------------------------------ */
/* Inline parser                                                       */
/* ------------------------------------------------------------------ */

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  let i = 0;
  const flush = () => {
    if (buf) out.push({ type: "text", value: buf });
    buf = "";
  };

  while (i < src.length) {
    const ch = src[i];

    // escape
    if (ch === "\\" && i + 1 < src.length) {
      buf += src[i + 1];
      i += 2;
      continue;
    }

    // code span
    if (ch === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > i) {
        flush();
        out.push({ type: "code", value: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // link [text](href)
    if (ch === "[") {
      const close = findClosing(src, i, "[", "]");
      if (close > i && src[close + 1] === "(") {
        const hrefEnd = src.indexOf(")", close + 2);
        if (hrefEnd > close) {
          flush();
          const href = src.slice(close + 2, hrefEnd).trim().split(/\s+/)[0] ?? "";
          out.push({ type: "link", href, children: parseInline(src.slice(i + 1, close)) });
          i = hrefEnd + 1;
          continue;
        }
      }
    }

    // strong **x** or __x__
    if ((ch === "*" || ch === "_") && src[i + 1] === ch) {
      const marker = ch + ch;
      const end = src.indexOf(marker, i + 2);
      if (end > i + 2) {
        flush();
        out.push({ type: "strong", children: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    // em *x* or _x_ (underscore only at word boundary)
    if (ch === "*" || (ch === "_" && (i === 0 || /\s|\(/.test(src[i - 1] ?? "")))) {
      const end = findEmphasisEnd(src, i + 1, ch);
      if (end > i + 1) {
        flush();
        out.push({ type: "em", children: parseInline(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }

    buf += ch;
    i += 1;
  }
  flush();
  return out;
}

function findClosing(src: string, start: number, open: string, close: string): number {
  let depth = 0;
  for (let j = start; j < src.length; j += 1) {
    if (src[j] === open) depth += 1;
    else if (src[j] === close) {
      depth -= 1;
      if (depth === 0) return j;
    }
  }
  return -1;
}

function findEmphasisEnd(src: string, from: number, marker: string): number {
  for (let j = from; j < src.length; j += 1) {
    if (src[j] === marker && src[j + 1] !== marker && j > from) {
      if (marker === "_" && /[A-Za-z0-9]/.test(src[j + 1] ?? "")) continue;
      return j;
    }
  }
  return -1;
}

/* ------------------------------------------------------------------ */
/* Block parser                                                        */
/* ------------------------------------------------------------------ */

const RE_HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RE_UL = /^(\s*)[-*+]\s+(.*)$/;
const RE_OL = /^(\s*)\d+[.)]\s+(.*)$/;
const RE_HR = /^\s*([-*_])(\s*\1){2,}\s*$/;
const RE_TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  return parseBlocks(lines);
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // fenced code
    const fence = line.match(/^\s*(`{3,}|~{3,})\s*(\S+)?\s*$/);
    if (fence) {
      const marker = fence[1] ?? "```";
      const lang = fence[2];
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith(marker)) {
        body.push(lines[i] ?? "");
        i += 1;
      }
      i += 1; // closing fence
      blocks.push({ type: "code", lang, value: body.join("\n") });
      continue;
    }

    // heading
    const h = line.match(RE_HEADING);
    if (h) {
      const text = h[2] ?? "";
      const children = parseInline(text);
      blocks.push({ type: "heading", level: (h[1] ?? "#").length, id: slugify(inlineToText(children)), children });
      i += 1;
      continue;
    }

    // hr
    if (RE_HR.test(line)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // blockquote
    if (/^\s*>/.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i] ?? "")) {
        inner.push((lines[i] ?? "").replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "blockquote", children: parseBlocks(inner) });
      continue;
    }

    // table
    if (line.trim().startsWith("|") && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1] ?? "")) {
      const header = splitRow(line).map(parseInline);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
        rows.push(splitRow(lines[i] ?? "").map(parseInline));
        i += 1;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    // list
    if (RE_UL.test(line) || RE_OL.test(line)) {
      const [list, next] = parseList(lines, i);
      blocks.push(list);
      i = next;
      continue;
    }

    // paragraph: consume until blank line or block start
    const para: string[] = [line.trim()];
    i += 1;
    while (i < lines.length) {
      const l = lines[i] ?? "";
      if (
        l.trim() === "" ||
        RE_HEADING.test(l) ||
        RE_HR.test(l) ||
        /^\s*>/.test(l) ||
        /^\s*(`{3,}|~{3,})/.test(l) ||
        RE_UL.test(l) ||
        RE_OL.test(l) ||
        (l.trim().startsWith("|") && RE_TABLE_SEP.test(lines[i + 1] ?? ""))
      ) {
        break;
      }
      para.push(l.trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", children: parseInline(para.join(" ")) });
  }

  return blocks;
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, "|").trim());
}

/** Analisa uma lista a partir de `start`; retorna [lista, próximo índice]. */
function parseList(lines: string[], start: number): [ListBlock, number] {
  const first = lines[start] ?? "";
  const firstMatch = first.match(RE_UL) ?? first.match(RE_OL);
  const baseIndent = (firstMatch?.[1] ?? "").length;
  const ordered = RE_OL.test(first) && !RE_UL.test(first);
  const items: ListItem[] = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.trim() === "") {
      // blank line inside list: continue only if next non-blank line is still a list item
      const next = lines[i + 1] ?? "";
      const m = next.match(RE_UL) ?? next.match(RE_OL);
      if (m && (m[1] ?? "").length >= baseIndent) {
        i += 1;
        continue;
      }
      break;
    }
    const m = line.match(RE_UL) ?? line.match(RE_OL);
    if (!m) {
      // continuation line of previous item (lazy continuation)
      const last = items[items.length - 1];
      if (last && /^\s+/.test(line)) {
        last.children.push({ type: "text", value: " " }, ...parseInline(line.trim()));
        i += 1;
        continue;
      }
      break;
    }
    const indent = (m[1] ?? "").length;
    if (indent < baseIndent) break;
    if (indent > baseIndent) {
      // nested list belongs to previous item
      const last = items[items.length - 1];
      const [sub, next] = parseList(lines, i);
      if (last) last.sublist = sub;
      else items.push({ children: [], sublist: sub });
      i = next;
      continue;
    }
    items.push({ children: parseInline(m[2] ?? "") });
    i += 1;
  }

  return [{ type: "list", ordered, items }, i];
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */

export interface MarkdownOptions {
  /** Reescreve hrefs (ex.: mapear arquivos .md do repositório para rotas do site). */
  resolveHref?: (href: string) => string;
  /** Deslocamento de nível de título (ex.: 1 transforma # em h2). */
  headingOffset?: number;
}

function renderInline(nodes: Inline[], opts: MarkdownOptions, keyPrefix = "i"): ReactNode[] {
  return nodes.map((n, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (n.type) {
      case "text":
        return n.value;
      case "code":
        return <code key={key}>{n.value}</code>;
      case "strong":
        return <strong key={key}>{renderInline(n.children, opts, key)}</strong>;
      case "em":
        return <em key={key}>{renderInline(n.children, opts, key)}</em>;
      case "link": {
        const href = opts.resolveHref ? opts.resolveHref(n.href) : n.href;
        const external = /^https?:\/\//.test(href);
        return (
          <a key={key} href={href} {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}>
            {renderInline(n.children, opts, key)}
          </a>
        );
      }
      default:
        return null;
    }
  });
}

function renderList(list: ListBlock, opts: MarkdownOptions, key: string): ReactNode {
  const Tag = list.ordered ? "ol" : "ul";
  return (
    <Tag key={key}>
      {list.items.map((item, idx) => (
        <li key={`${key}-${idx}`}>
          {renderInline(item.children, opts, `${key}-${idx}`)}
          {item.sublist ? renderList(item.sublist, opts, `${key}-${idx}-s`) : null}
        </li>
      ))}
    </Tag>
  );
}

export function renderBlocks(blocks: Block[], opts: MarkdownOptions = {}, keyPrefix = "b"): ReactNode[] {
  const offset = opts.headingOffset ?? 0;
  return blocks.map((b, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (b.type) {
      case "heading": {
        const level = Math.min(6, Math.max(1, b.level + offset));
        const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
        return (
          <Tag key={key} id={b.id}>
            {renderInline(b.children, opts, key)}
          </Tag>
        );
      }
      case "paragraph":
        return <p key={key}>{renderInline(b.children, opts, key)}</p>;
      case "list":
        return renderList(b, opts, key);
      case "code":
        return (
          <pre key={key} data-lang={b.lang}>
            <code>{b.value}</code>
          </pre>
        );
      case "blockquote":
        return <blockquote key={key}>{renderBlocks(b.children, opts, key)}</blockquote>;
      case "hr":
        return <hr key={key} />;
      case "table":
        return (
          <div key={key} className="md-table-wrap">
            <table>
              <thead>
                <tr>
                  {b.header.map((cell, c) => (
                    <th key={`${key}-h-${c}`} scope="col">
                      {renderInline(cell, opts, `${key}-h-${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, r) => (
                  <tr key={`${key}-r-${r}`}>
                    {row.map((cell, c) => (
                      <td key={`${key}-r-${r}-${c}`}>{renderInline(cell, opts, `${key}-r-${r}-${c}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  });
}

export function renderMarkdown(md: string, opts: MarkdownOptions = {}): ReactNode[] {
  return renderBlocks(parseMarkdown(md), opts);
}

/** Índice de títulos (para sumário). */
export function headingsOf(blocks: Block[], maxLevel = 2): { id: string; level: number; text: string }[] {
  return blocks
    .filter((b): b is Extract<Block, { type: "heading" }> => b.type === "heading" && b.level <= maxLevel)
    .map((h) => ({ id: h.id, level: h.level, text: inlineToText(h.children) }));
}

export function Markdown({ source, ...opts }: { source: string } & MarkdownOptions) {
  return <>{renderMarkdown(source, opts)}</>;
}
