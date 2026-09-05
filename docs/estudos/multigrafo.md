# Memorando técnico: grafo do Novelo Master em múltiplos núcleos

> **Estudo, não decisão.** Este memorando avalia esforço e viabilidade de apresentar o grafo
> separado em frentes. Nada dele foi implementado; a decisão foi adiada. O protótipo vive na branch
> `estudo/multigrafo` e é descartável por construção.
>
> **Os agrupamentos citados aqui são saída de algoritmo** (Louvain sobre o grafo do corpus), não
> classificação editorial. Duas pessoas caírem no mesmo grupo significa que os registros que as
> mencionam se conectam no mapa — nada além disso. Não implica associação, afinidade, participação
> conjunta nem ilicitude. O próprio estudo mede a instabilidade dessas partições e conclui que elas
> não servem como rótulo publicado. Valem as regras de [EDITORIAL_POLICY.md](../../EDITORIAL_POLICY.md).

Data: 2026-09-04. Base: branch `main` (51f017b), corpus com 393 nós / 1006 arestas. Protótipo descartável na branch `estudo/multigrafo` (commit 25e984c, sem push, sem merge). Nada foi alterado em `src/` ou `data/` de `main`.

## Resposta curta

É viável e barato. A partição não exige mudar a arquitetura: entra como um atributo por nó calculado no build e como uma dimensão a mais no filtro do cliente, que já opera por conjuntos visíveis sem reconstruir o Sigma. O que não existe hoje é o **dado** que define os núcleos: o campo `tags` está vazio em 100% dos 376 registros de pessoas, organizações e eventos. A decisão real é editorial (quem define e nomeia as frentes), não técnica.

Recomendação: começar por lentes sobre dados existentes (1 dia), evoluir para frentes definidas no corpus com o algoritmo como sugestão e não como rótulo (1 semana), e só então decidir se o layout em ilhas vale o custo (1 mês, condicional). Não fazer vários `graph.json`.

## 1. Como o grafo é montado hoje e onde a partição entra

- **Build** (`scripts/lib/graph.ts`): corpus → nós (pessoas, orgs, eventos, atos) e arestas (relações, participação, atuação, transações) → ForceAtlas2 determinístico (600 iterações, seed 42, gravidade 1) → `public/data/graph.json` (1,54 MB) + camada probatória à parte (2,4 MB, sob demanda). Build de dados completo: 6,5 a 10 s.
- **Cliente** (`GraphExplorer` + `GraphCanvas`): um fetch, um índice, um grafo Sigma construído uma vez. Tudo que muda depois (filtros, time machine, foco, seleção) passa por `applyFilters`, função pura que devolve conjuntos visíveis, e por `nodeReducer`/`edgeReducer`, que só escondem ou esmaecem. URL carrega `n`, `e`, `oficial`, `documentado`, `ate`, `dataset`.
- **Ponto de entrada da partição**: (i) no build, um campo `frente` por nó (e opcionalmente posições por ilha); (ii) no cliente, um campo `frente` no `FilterState`, uma linha a mais no `applyFilters` e um parâmetro `?frente=` na URL. Nenhum componente precisa ser reescrito.

Dados que existem hoje para derivar núcleos: `person.category` (11 valores), `org_type` (8), família da relação (7), `event_type` (14) e 9 sequências temporais. Não há tema, cluster ou frente registrado em lugar nenhum.

## 2. Três abordagens

### a. Lentes sobre dado existente (filtram o mesmo grafo)

Uma lente é um predicado sobre atributos que já estão no `graph.json`: tipo de nó, subtipo, família da relação. Exemplos que o dado sustenta: "Instituições e atos" (órgãos, tribunais, família institucional), "Empresarial" (empresas, fundos, instituições financeiras, famílias societária e financeira), "Alegações investigativas" (família allegation), "Político" (políticos, partidos, família política).

- Custo: 1 a 2 dias (estado, chips no painel, `?lente=`, testes unitários e um E2E). Risco baixo; nada no build muda.
- Limite: é uma lente por **categoria**, não por **história**. "Consignado/CredCesta" ou "Autorização do Máxima" não emergem de tipos. Para isso é preciso dado novo (ver b).
- Tamanhos medidos por família (só relações e transações): financeira 60 arestas / 58 nós; institucional 56 / 66; societária 43 / 55; alegação 38 / 39; profissional 28 / 34; social 13 / 17; política 8 / 14. Lentes pequenas demais para "navegar entre núcleos", boas para "ver só o que é X".

### b. Comunidades por algoritmo no build (Louvain), nomeadas por regra e revisadas

`graphology-communities-louvain` já é dependência. Medido sobre o grafo real:

| Resolução       | Núcleos (≥ 5 nós) | Modularidade | Leitura                                      |
| --------------- | ----------------- | ------------ | -------------------------------------------- |
| 0,6             | 8                 | 0,635        | BC/Master/BRB juntos; STF/PF/Mendonça juntos |
| 0,7 (protótipo) | 11 + 3 isolados   | 0,611        | ver lista abaixo                             |
| 1,0             | 13                | 0,567        | separa BC de Master, e PF de STF             |
| 1,4             | 17                | 0,523        | fragmenta demais                             |

Núcleos a 0,7, pela âncora de maior grau: Banco Master / BC / BRB (91 nós); Vorcaro / Zettel / CPMI do INSS (77); Mendonça / PF / STF (67); Augusto Lima / Wagner / CredCesta (44); Thiago Miranda / ICB / Go Up (31); Senado / FGC / Ciro Nogueira (26); Benjamim Botelho / Foco DTVM (16); Henrique Vorcaro e família (13); Câmara / Hugo Motta (10); RioPrevidência / Cláudio Castro (9); Consult / Coaf (6). A leitura é boa: cada núcleo corresponde a uma frente que o CHANGELOG já narra.

- Custo de cálculo: 164 ms no build (irrelevante). Tamanho: +7 KB no JSON.
- **Estabilidade (o ponto fraco)**: entre seeds, ARI 0,84 a 0,93; removendo 5% das arestas (equivalente a um lote grande do corpus), ARI 0,64 a 0,76; removendo 10%, 0,62 a 0,70. Ou seja: a cada lote, dezenas de nós podem trocar de núcleo e uma URL `?frente=` de ontem pode mostrar outra coisa hoje. Inaceitável como rótulo publicado; aceitável como **sugestão** para o editor.
- **Fronteiras**: 274 das 1006 arestas (27%) cruzam núcleos. Vorcaro toca 13 núcleos, PF 12, Banco Master 10, Mendonça 10, STF 9, BC 6. Os hubs não pertencem a núcleo nenhum; são a estrutura do caso.
- Custo total: 1 semana, se a atribuição final for **persistida em `data/`** (campo novo em pessoas, orgs e eventos, com vocabulário fechado e lint), usando o Louvain só para propor e para detectar drift ("o algoritmo hoje colocaria X na frente Y; o corpus diz Z").

### c. Multigrafo real

**c1. Um `graph.json` por núcleo + página índice.** Medido: 14 arquivos somando 2,14 MB contra 1,54 MB do único (o `source_index` se repete em cada um). Quebra caminho mínimo entre núcleos, seleção múltipla cruzada e time machine global; muda todas as URLs; exige reescrever carregamento, índice e E2E. Custo 2 a 3 semanas. **Não recomendado**: perde exatamente o que o grafo único faz bem (mostrar que as frentes se tocam).

**c2. Um canvas, layout em ilhas (protótipo feito).** ForceAtlas2 por núcleo e centróides em círculo, calculados no build (93 ms). Mesmo JSON, mesmas URLs, mesmos filtros, mesma camada probatória; só `x`/`y` e um campo `community` mudam. No Sigma real: 120 fps em repouso, zoom e hover (monitor de 120 Hz); troca de filtro repinta em 40 a 100 ms em modo dev. Problema visível na figura: as 274 arestas cruzadas viram uma teia no centro e as distâncias mentem (vizinhos diretos ficam nas bordas opostas). Correção conhecida: FA2 global com um atrator invisível por núcleo, em vez de círculo (2 a 3 dias de ajuste). Fronteiras visíveis: o Sigma não desenha envelopes; uma camada 2D sobre o canvas com casco convexo por núcleo custa 1 a 2 dias.

## 3. Impacto por abordagem

|                                                 | a. Lentes                  | b. Frentes no corpus + Louvain        | c1. Vários JSON                 | c2. Ilhas                              |
| ----------------------------------------------- | -------------------------- | ------------------------------------- | ------------------------------- | -------------------------------------- |
| URLs (`?e=`, `?n=`)                             | preservadas; `+?lente=`    | preservadas; `+?frente=`              | quebram (id não diz o arquivo)  | preservadas                            |
| Seleção múltipla e caminho mínimo entre núcleos | funcionam (lente é filtro) | funcionam                             | perdidos ou refeitos            | funcionam                              |
| Time machine                                    | funciona (interseção)      | funciona                              | por arquivo                     | funciona                               |
| Camada probatória                               | intacta                    | intacta (nós de evidência sem frente) | duplicar por arquivo            | intacta                                |
| E2E (`tests/e2e/graph.spec.ts`, dataset demo)   | +1 teste                   | +1 teste; demo precisa de `frente`    | reescrever                      | dataset demo precisa de posições novas |
| Download                                        | 0                          | +7 KB                                 | +40% no total, menos por visita | +7 KB                                  |
| Build                                           | 0                          | +0,2 s                                | +0,5 s                          | +0,1 s                                 |

## 4. Riscos editoriais

- **Nome nunca é nome de pessoa.** O protótipo nomeia pela âncora de maior grau e produziu "N2 · Daniel Vorcaro": um núcleo com nome de pessoa lê como "organização de fulano". Regra: nome por instituição, ato ou evento âncora ("Autorização do BC ao Máxima", "Consignado e CredCesta", "Liquidação e BRB"), decidido no corpus, nunca pelo algoritmo.
- **A palavra "núcleo" é vocabulário de denúncia** (a PGR organiza denunciados em "núcleo 1", "núcleo financeiro"). Usar "frente", que o CHANGELOG já usa, ou "recorte" para as lentes.
- **Nós-ponte não são "elos".** Mostrar "aparece em 4 frentes" como contagem, sem adjetivo, e tratar os hubs (Vorcaro, Master, PF, STF, BC) como pertencentes a todas as frentes por construção, não como pontes. O card do nó já tem o lugar certo para isso (contadores).
- **Cor de frente não pode colidir com cor de família de relação**, que é o código semântico atual (cor = natureza, forma = força). Frente deve aparecer como envelope ou fundo, não como cor de aresta.
- **Nota de metodologia obrigatória**: algoritmo, resolução, data do cálculo, que a atribuição foi revisada por editor, que fronteira não é conclusão e que a mesma pessoa pode aparecer em várias frentes por participar de eventos distintos.

## 5. Recomendação e fases

**Fase 1 (1 dia): lentes.** Campo `lente` no `FilterState`, chips no painel de filtros, `?lente=<id>` na URL, lentes definidas em um arquivo `src/lib/graph/lentes.ts` como predicados sobre subtipo e família. Aceite: `npm run check` e `npm run test:e2e` verdes; `/grafo?lente=institucional` mostra apenas arestas da família institucional e o contador bate com o teste unitário; link compartilhado abre com a lente aplicada.

**Fase 2 (1 semana): frentes no corpus.** Campo `front_ids` (ou `tags` com vocabulário fechado em `data/fronts/<id>.yaml`: nome, definição, evento âncora, fontes) em pessoas, orgs e eventos; lint recusa frente sem definição; `scripts/lib/graph.ts` exporta `fronts` por nó e roda Louvain só para o relatório de drift; chips "Frentes", contador "aparece em N frentes" no card, nota em `/metodologia`. Aceite: dois builds seguidos produzem o mesmo `graph.json`; relatório de drift lista divergências algoritmo × corpus; E2E com o dataset demo cobrindo `?frente=`; texto de metodologia publicado. O trabalho de atribuir frente a ~376 registros é do fork (pesquisa), não do site.

**Fase 3 (1 mês, condicional a Fase 2 aprovada em uso): ilhas.** Layout com atrator por frente no build, envelope por frente na camada 2D, página `/frentes` estática com miniatura e lista por frente, dataset demo com posições. Aceite: nenhuma aresta cruza o centro sem que os dois extremos sejam hubs; FPS ≥ 60 no stress (5.000/25.000) com envelopes ligados; troca de frente < 100 ms em produção; E2E de stress verde.

## 6. Medições do protótipo

| Métrica                                                        | Valor                                 |
| -------------------------------------------------------------- | ------------------------------------- |
| Louvain + layout por ilha (Node, build)                        | 164 ms (93 ms de layout)              |
| Build de dados completo hoje                                   | 6,5 a 10 s                            |
| `graph.json` atual / com `community` e posições em ilha        | 1.544 KB / 1.551 KB                   |
| 14 JSON por núcleo (abordagem c1)                              | 2.141 KB no total                     |
| `applyFilters` por troca de lente (Node, mesmo código do site) | 0,44 a 0,54 ms                        |
| Toggle de filtro até repintar (navegador, dev)                 | 40 a 100 ms                           |
| FPS em repouso / zoom / hover (Sigma, protótipo)               | 120 / 120 / 120                       |
| Arestas que cruzam fronteira (res. 0,7)                        | 274 de 1006 (27%)                     |
| Estabilidade entre seeds / com −5% arestas / −10%              | ARI 0,84–0,93 / 0,64–0,76 / 0,62–0,70 |

Figuras: `islands.png` (render SVG do layout em ilhas, com envelopes) e `sigma-ilhas.png` (o mesmo layout no Sigma real, branch `estudo/multigrafo`, `?dataset=ilhas`). Scripts em `docs/estudos/multigrafo/` na branch.

## 7. Adendo: configuração pelo leitor e apoio de IA

Pergunta do Rafael: o leitor poderia escolher quantos núcleos, o tipo de agrupamento etc.? E IA ajudaria a tornar isso compreensível?

**Viabilidade técnica: alta.** Louvain sobre o grafo atual leva 3 ms; sobre o stress (5.000/25.000), 25 a 67 ms. Graphology já está no bundle e o worker de layout já existe. Recalcular grupos e ilhas no navegador a cada ajuste cabe em um quadro. Custo de 3 a 5 dias: seletor "agrupar por", três níveis de detalhe, recálculo no cliente, `?agrupar=&detalhe=` na URL, rótulo por regra, aviso permanente, E2E.

| Detalhe (resolução)  | Grupos ≥ 5 nós no corpus | Grupos ≥ 5 nós no stress | Tempo (stress) |
| -------------------- | ------------------------ | ------------------------ | -------------- |
| amplo (0,5)          | 7                        | 2                        | 31 ms          |
| médio (0,7)          | 11                       | 11                       | 26 ms          |
| fino (1,0)           | 13                       | 18                       | 25 ms          |
| muito fino (1,5 a 2) | 18 a 23                  | 40 a 60                  | 52 a 67 ms     |

**O problema não é técnico, é de leitura.** "Quantos núcleos" e "resolução" são parâmetros de analista; o leitor do site quer responder perguntas ("como o Master chegou ao BRB?", "quem decidiu a autorização de 2019?"). E dois leitores com detalhe diferente veem grupos diferentes, com nomes gerados na hora e sem revisão; a captura de tela compartilhada leva o rótulo automático com a marca do site. Por isso a configuração deve aparecer como escolha de pergunta, não de número:

- **"Ver por"**: Instituições · Dinheiro e empresas · Justiça e investigação · Política · Tempo. Cada opção é uma lente (seção 2a) combinada com um agrupamento; sem "Louvain" nem "resolução" na interface, só na metodologia.
- **"Detalhe"**: amplo / médio / fino (as três primeiras linhas da tabela). Sem slider numérico.
- **"Explique este grupo"**: painel derivado só de dado: nós âncora, eventos que unem o grupo (26 eventos têm 6 ou mais participantes e são bons candidatos), quantas arestas saem para fora, fontes. Nenhum texto gerado em runtime.
- Configuração livre (slider, escolha de algoritmo) só em um modo "análise" avançado, se houver demanda, com o aviso "agrupamento automático, não é conclusão editorial" impresso na tela e na imagem de compartilhamento.

**Onde a IA entra e onde não entra.**

1. _No site, em runtime, para o leitor_: não recomendo. Site estático, CSP fecha fetch a terceiros, custo por leitor, e uma resposta errada vira "o site disse". A página `/perguntar` já cobre isso com o assistente do próprio leitor e o `acervo.txt`; dá para reforçar com um prompt por frente ("explique a frente X a partir do acervo"), custo de horas.
2. _No editor, offline (fork)_: IA propõe nome, resumo de três linhas e "limites" de cada frente a partir das evidências dos nós, no mesmo formato das sequências temporais (`description`, `limits`, `source_ids`); lint exige fontes; editor aprova. Custo de 2 a 3 dias de script mais a revisão. É o uso que mais ajuda a compreensão: um texto curto e com fonte ao lado de cada grupo.
3. _Trilhas guiadas_: sequência de passos (nó ou aresta, filtro, data da time machine, câmera, duas frases com fontes), rascunhada por IA a partir das 9 sequências e dos eventos-âncora, revisada pelo editor, tocada por um player que reaproveita `cameraTarget`, time machine e seleção existentes. Custo de 1 semana. É o que jornalismo de dados faz e não exige que o leitor configure nada.

**Recomendação revisada.** Não expor parâmetros; expor perguntas. Ordem: lentes (fase 1) → trilhas guiadas com texto revisado, IA como rascunhadora (1 semana) → "Ver por" + "Detalhe" em três níveis com recálculo no cliente e "Explique este grupo" derivado de dado (3 a 5 dias). Aceite adicional: nenhum rótulo de grupo contém nome de pessoa; toda trilha tem fonte em cada passo e passa no lint; a imagem de compartilhamento de uma vista agrupada carrega o aviso.

## 8. Adendo: o que a simulação mostrou, e o estado da decisão

Simulação interativa com os 393 nós reais, publicada em 2026-09-04
(https://claude.ai/code/artifact/29a08163-6b63-4399-9a89-173e417e7e71). Rafael avaliou e **adiou a
decisão**: a utilidade do multigrafo ainda não está demonstrada a ponto de justificar o esforço. Nada
foi implementado. Os achados abaixo ficam registrados em `docs/estudos/multigrafo/ACHADOS.md` na
branch `estudo/multigrafo`, para que a discussão possa ser retomada sem refazer medição.

**O eixo central substitui o layout em ilhas puro.** Tirando cinco hubs do mapa (Vorcaro, Banco
Master, PF, STF e Mendonça) e pondo-os num anel central, as arestas que cruzam entre frentes caem de
27% para 8% e a modularidade sobe de 0,61 para 0,81. As 357 ligações ao eixo viram raios para o
centro em vez de teia. É melhor e mais barato do que a correção de layout prevista na seção 2c.

| Eixo                     | Cruzando entre frentes | Modularidade | Efeito na leitura                                         |
| ------------------------ | ---------------------- | ------------ | --------------------------------------------------------- |
| 5 hubs escolhidos        | 76 de 1006 (8%)        | 0,81         | frentes reconhecíveis, inclusive Banco Central com 43 nós |
| 6 hubs (regra grau ≥ 35) | 60 de 1006 (6%)        | 0,82         | a frente do Banco Central desaparece do mapa              |
| 8 hubs (grau ≥ 19)       | 43 de 1006 (4%)        | 0,84         | somem Senado e FGC como frente reconhecível               |

**O eixo não pode ser definido por regra de grau.** A métrica melhora à medida que o eixo cresce e a
leitura piora: o Banco Central é hub e frente ao mesmo tempo, e as autorizações de 2019 são uma das
histórias centrais do caso. O eixo é uma lista curta decidida editorialmente; a métrica só confere
que o desenho não ficou ilegível.

**O nome automático confirma o risco editorial.** Corrigida para não nomear por pessoa, a regra passa
a produzir nomes que não descrevem a frente: o consignado sai como "Governo do Estado da Bahia" e o
inquérito como "Ministério Público Federal", porque STF e PF estão no eixo. Nome tem de vir do
corpus, revisado.

**A trilha guiada é o que mais entrega compreensão, e não depende de frentes.** Cada passo é um evento
real com data, descrição, classe de evidência e fontes, e a sequência termina nos seus próprios
limites, como o corpus já registra. Se apenas uma coisa desta proposta for feita, que seja esta: ela
funciona mesmo que o multigrafo seja abandonado.
