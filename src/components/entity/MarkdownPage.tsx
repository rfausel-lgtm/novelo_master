import fs from "node:fs";
import path from "node:path";
import { parseMarkdown, renderBlocks } from "@/lib/markdown";

const DOC_ROUTES: Record<string, string> = {
  "METHODOLOGY.md": "/metodologia",
  "EDITORIAL_POLICY.md": "/politica-editorial",
  "OSINT_GUIDELINES.md": "/metodologia#fontes",
  "DATA_SCHEMA.md": "/rede",
  "CONTRIBUTING.md": "/metodologia#contribuir",
  "SECURITY.md": "/metodologia",
};

/** Renderiza um .md da raiz do repositório em build time (server component). */
export function MarkdownPage({ file }: { file: string }) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) {
    return <p className="text-fg-3 text-sm italic">Documento {file} ainda não disponível nesta build.</p>;
  }
  const md = fs.readFileSync(full, "utf8");
  // Remove o título de nível 1 (a página já tem o seu).
  const body = md.replace(/^#\s+[^\n]+\n/, "");
  const blocks = parseMarkdown(body);
  return (
    <div className="prose-novelo">
      {renderBlocks(blocks, {
        resolveHref: (href) => {
          const m = /^([A-Z_]+\.md)(#.*)?$/.exec(href);
          if (m) return (DOC_ROUTES[m[1]] ?? "/") + (m[2] ?? "");
          return href;
        },
      })}
    </div>
  );
}
