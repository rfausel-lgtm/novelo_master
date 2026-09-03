import type { LoadIssue } from "./load";

export function printIssues(issues: LoadIssue[]): void {
  const sorted = [...issues].sort((a, b) =>
    a.level === b.level ? a.file.localeCompare(b.file) : a.level === "error" ? -1 : 1,
  );
  for (const i of sorted) {
    const tag = i.level === "error" ? "ERRO " : "aviso";
    const line = `[${tag}] ${i.file}: ${i.message}`;
    if (i.level === "error") console.error(line);
    else console.warn(line);
  }
}
