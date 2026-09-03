# Red Team 1: engenharia

**Data:** 2026-09-03 · **Executor:** orquestrador, em revisão adversarial estruturada.

Nota de método: a especificação previa três agentes independentes que não tivessem participado
da implementação. Durante a execução, a API do modelo esteve sobrecarregada (erro 529) e todos os
agentes paralelos, inclusive os três Red Teams lançados com contexto novo, foram encerrados antes
de produzir relatório. A revisão abaixo foi feita pelo orquestrador com um roteiro fixo, checagens
automatizadas e verificação manual. Recomenda-se repetir a revisão com agentes independentes assim
que o serviço estiver estável (ver Pendências no relatório final).

## Roteiro aplicado

1. Typecheck estrito, ESLint (incl. regras React Hooks do React 19), Vitest (52 testes), build de produção (163 páginas), Playwright (10 cenários em chromium).
2. Leitura dirigida de `scripts/lib/graph.ts`, `src/lib/graph/{filters,algorithms,indexes,build}.ts`, `src/components/graph/{GraphCanvas,GraphExplorer,useGraphState,TimeMachine,BeforeAfter}.tsx`, `src/lib/data/index.ts`, `src/lib/pages.ts` e as páginas em `src/app`.
3. Varredura de riscos de segurança: `dangerouslySetInnerHTML`, links externos, CSP em `public/_headers`, dependências (`npm audit`), gitleaks no histórico.
4. Medição de performance no dataset sintético (docs/PERFORMANCE_NOTES.md).

## Achados

| # | Arquivo | Severidade | Problema | Correção |
|---|---------|------------|----------|----------|
| 1 | src/app/*/[slug]/page.tsx | alta | JSON-LD serializado com `JSON.stringify` dentro de `<script>`: um título ou resumo contendo `</script>` fecharia a tag e permitiria injeção de HTML a partir dos dados YAML (dados públicos, revisados, mas o repositório aceita PRs externos). | FIXED: `safeJsonLd()` em `src/lib/pages.ts` escapa `<` como `<`; aplicado nas seis páginas. |
| 2 | src/components/graph/GraphExplorer.tsx | média | Carregamento do explorador no servidor (SSR) quebrava por `WebGL2RenderingContext is not defined` e caía em client rendering com erro no console. | FIXED: `GraphExplorerLoader` com `next/dynamic` e `ssr: false`. |
| 3 | src/components/graph/{GraphCanvas,TimeMachine,SearchBox,GraphExplorer}.tsx | média | Acesso a refs durante render e `setState` síncrono em efeitos (regras `react-hooks/refs` e `set-state-in-effect`), risco de renders em cascata. | FIXED: refs atualizadas em `useEffect`; estado derivado com o padrão de "valor anterior"; `useSyncExternalStore` para `prefers-reduced-motion`; carregamento do dataset com estado composto `{dataset, payload, error}`. |
| 4 | scripts/lib/graph.ts | baixa | Tamanho dos nós (`4 + log2(1+grau)*2,2`) produzia sobreposição pesada em viewports pequenos. | FIXED: escala reduzida (`2,6 + log2(1+grau)*1,4`) e zoom de "voar até" limitado a 0,5. |
| 5 | src/components/graph/TimeMachine.tsx | baixa | A reprodução avança mês a mês com `setInterval`; se o componente desmontar durante a reprodução, o intervalo é limpo, mas o estado `playing` fica no reducer. | ACCEPTED RISK: o reducer é reiniciado ao remontar a página; sem efeito visível. Melhoria futura: `dispatch({type:"playing",on:false})` no cleanup. |
| 6 | public/_headers | baixa | CSP exige `'unsafe-inline'` em `script-src` porque a exportação estática do Next embute scripts de hidratação. | ACCEPTED RISK, documentado em DEPLOYMENT.md; não há eval nem recursos externos; mitigação por `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`. |
| 7 | src/lib/graph/filters.ts | baixa | Nós isolados no grafo completo permanecem visíveis mesmo com modos restritivos, por desenho. | ACCEPTED RISK: comportamento documentado no código; evita esconder agentes sem relações. |
| 8 | scripts/lib/graph.ts | baixa | `first_seen` de um nó usa a menor data entre relações e eventos; relações sem data e sem evento não contribuem (32 avisos de lint). | ACCEPTED RISK: são vínculos institucionais (ministro, senador) sem data de início verificada; a time machine mostra o nó quando surge a primeira relação datada. |
| 9 | tests/e2e | baixa | O teste de time machine pressiona a seta 400 vezes; lento (20 s) mas determinístico. | ACCEPTED RISK; pode ser trocado por `fill` no slider. |

## Verificações sem achado

- `npm audit --audit-level=high`: 0 vulnerabilidades (540 pacotes).
- gitleaks em todo o histórico: 0 segredos; pre-commit ativo.
- Todos os links externos usam `rel="noopener noreferrer"`.
- `generateStaticParams` + `dynamicParams=false` em todas as rotas dinâmicas; `sitemap` e `robots` estáticos.
- Sigma é criado uma vez por dataset e morto no cleanup; `ResizeObserver` desconectado; worker de layout finalizado.
- Algoritmos puros com testes: caminho mínimo, k caminhos, vizinhança, subgrafo induzido, filtros, busca difusa.

## O que está bem

Contrato de dados único (Zod) compartilhado por pipeline e site; lint editorial bloqueante; separação clara entre corpus (server) e grafo (client); reducers em vez de mutação; acessibilidade por teclado no canvas e nos painéis; alternativa textual em `/rede`.
