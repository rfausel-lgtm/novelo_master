import type { LoadIssue } from "./load";

export function printIssues(issues: LoadIssue[]): void {
  const rank = { error: 0, warning: 1, info: 2 } as const;
  const sorted = [...issues].sort((a, b) => rank[a.level] - rank[b.level] || a.file.localeCompare(b.file));
  for (const i of sorted) {
    const tag = i.level === "error" ? "ERRO " : i.level === "warning" ? "aviso" : "info ";
    const line = `[${tag}] ${i.file}: ${i.message}`;
    if (i.level === "error") console.error(line);
    else console.warn(line);
  }
}
