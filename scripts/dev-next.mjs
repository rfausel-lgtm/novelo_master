import { spawn } from "node:child_process";

// Aceita os argumentos do preview supervisionado preservando o servidor Next.js.
const args = process.argv
  .slice(2)
  .filter((arg) => arg !== "--strictPort")
  .map((arg) => (arg === "--host" ? "--hostname" : arg));
const command = process.argv.includes("--host")
  ? ["scripts/preview-export.mjs", ...process.argv.slice(2)]
  : ["node_modules/next/dist/bin/next", "dev", ...args];
const child = spawn(process.execPath, command, {
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
