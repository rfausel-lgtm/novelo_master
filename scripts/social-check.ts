/**
 * Confere `public/social/` contra o contrato de arte de lote (docs/ARTE-DE-LOTE.md).
 *
 * Não escreve, não abre navegador, não depende de `corpus.json` nem da ordem do build: a fonte de
 * verdade dos ids é `data/revisions/`. É o gate mecânico; o que não se verifica por máquina — rosto
 * de pessoa real, simulação de documento, alegação nova — exige inspeção visual registrada
 * (EDITORIAL_POLICY seção 7.1), e nenhum dos dois substitui o outro.
 *
 *   npm run social:check
 */
import { conferirPasta } from "./lib/artes";

const problemas = conferirPasta();
for (const p of problemas) console.error(`[erro ] ${p}`);
console.log(
  problemas.length === 0
    ? "✔ public/social/ conforme ao contrato de arte de lote"
    : `✗ ${problemas.length} problema(s) em public/social/`,
);
process.exit(problemas.length === 0 ? 0 : 1);
