# Notas de performance do grafo

Medições de 2026-09-03 em notebook Dell (Windows 11), Chrome integrado ao Claude Code, servidor de
desenvolvimento do Next (não a build de produção).

| Dataset | Nós / arestas | JSON | Carregamento até render | FPS em repouso | Heap JS |
|---------|---------------|------|-------------------------|----------------|---------|
| `graph-demo.json` | 120 / 400 | 0,1 MB | < 1 s | 60 | ~20 MB |
| `graph-stress.json` | 5.000 / 25.000 | 13,6 MB | ~8 a 12 s (parse + índice + Sigma) | 61 | 47 MB |

Observações:

- O layout do dataset de estresse é pré-calculado no build (`npm run data:stress`, ForceAtlas2 com
  Barnes-Hut, 200 iterações em ~10,6 s no Node). No cliente, "Reorganizar" roda FA2 em Web Worker
  por 4 s e para.
- Com mais de 2.000 arestas, `hideEdgesOnMove` é ativado: pan e zoom só desenham nós durante o
  movimento, o que mantém a fluidez em desktop modesto.
- Hover, seleção e filtros usam `nodeReducer`/`edgeReducer` (sem mutação do grafo e sem recriar o
  Sigma). Os conjuntos visíveis são calculados em funções puras (`applyFilters`, `neighborhood`,
  `inducedSubgraph`) e memoizados por estado.
- Rótulos: `labelRenderedSizeThreshold` cresce com o tamanho do grafo (4 → 7 → 9 px), limitando a
  densidade de texto no zoom afastado.
- Limitação conhecida: o parse inicial de 13,6 MB bloqueia a thread principal por alguns segundos.
  Mitigação futura: formato binário ou carregamento por partes; fora do escopo da V1, cujo corpus
  real tem centenas de nós.
