# ADR-0004 — Sigma.js 3 + Graphology para o grafo

**Data:** 2026-09-03 · **Status:** aceito

## Decisão
- Renderização WebGL com Sigma 3; modelo de dados com Graphology (multi-grafo misto).
- Layout ForceAtlas2 calculado no build (determinístico, seed fixa) e refinável no cliente via
  worker (`graphology-layout-forceatlas2/worker`) para datasets grandes.
- Programas de aresta próprios para representar a força da evidência por forma
  (sólida / sólida curta / tracejada / pontilhada), mantendo cor = natureza da relação.
- Algoritmos (caminho mínimo, vizinhança, subgrafo comum) com `graphology-shortest-path` e
  `graphology-traversal`.

## Consequências
- Alvo de performance: 5.000 nós / 25.000 arestas fluidos em desktop moderno (dataset sintético em
  `npm run data:stress`).
