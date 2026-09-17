/**
 * Forças do ForceAtlas2 usadas no layout do build (`scripts/lib/graph-layout.ts`) e no
 * "Reorganizar" do explorador. As duas pontas precisam das mesmas forças: com outras, a
 * reorganização desmontaria o desenho do build em vez de refiná-lo.
 *
 * LinLog separa comunidades; a distribuição da atração pelo grau ficou desligada porque empurra
 * os hubs para a borda do desenho, e as arestas deles passam a cruzar a tela inteira.
 */
export const FA2_LAYOUT_SETTINGS = {
  linLogMode: true,
  outboundAttractionDistribution: false,
  gravity: 1,
  scalingRatio: 2,
} as const;
