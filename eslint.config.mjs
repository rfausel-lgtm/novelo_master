import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    // Worktrees de sessões paralelas vivem dentro do repositório e não devem ser linkadas aqui.
    // `.codex/` entrou depois: sem ele, `npm run lint` passou a varrer as cópias inteiras do repo
    // que a automação de artes deixa em .codex/worktrees/ — 1.284 arquivos alheios e 75 mil
    // apontamentos, num comando que antes devolvia um aviso.
    ".claude/**",
    ".codex/**",
  ]),
]);

export default eslintConfig;
