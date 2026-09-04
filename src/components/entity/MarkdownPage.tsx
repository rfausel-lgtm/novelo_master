import fs from "node:fs";
import path from "node:path";
import { parseMarkdown, renderBlocks } from "@/lib/markdown";

/*
 * A página é o que o cético abre para decidir se confia. Links rotulados com nome de arquivo
 * ("EDITORIAL_POLICY.md") a fazem parecer README de repositório, escrita para contribuidor.
 */
const DOC_LABELS: Record<string, string> = {
  "METHODOLOGY.md": "metodologia",
  "EDITORIAL_POLICY.md": "política editorial",
  "OSINT_GUIDELINES.md": "diretrizes de captura de fontes",
  "DATA_SCHEMA.md": "esquema dos dados",
  "CONTRIBUTING.md": "como contribuir",
  "SECURITY.md": "política de segurança",
};

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
        resolveLinkText: (href) => {
          const m = /^([A-Z_]+\.md)(#.*)?$/.exec(href);
          return m ? DOC_LABELS[m[1]] : undefined;
        },
        resolveHref: (href) => {
          const m = /^([A-Z_]+\.md)(#.*)?$/.exec(href);
          if (m) return (DOC_ROUTES[m[1]] ?? "/") + (m[2] ?? "");
          return href;
        },
      })}
    </div>
  );
}
