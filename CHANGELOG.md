# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). O histórico editorial
dos dados está em `/atualizacoes` no site e em `data/revisions`.

## [Não publicado]

### Adicionado

- Lote 7 do corpus, a partir de documentos primários lidos na íntegra: decisão da Petição 16.229
  (9ª fase da Compliance Zero, 17/06/2026), com os três eixos da apuração sobre Jaques Wagner, o
  apartamento nº 1.702 do Poème Horto, a BN Financeira, a Epítome S.A. e as medidas cautelares;
  decisão da 4ª Vara Federal Criminal do Amapá na operação Zona Cinzenta, com a conduta
  individualizada dos gestores da Amprev e a ata de 30/07/2024; decisão da 6ª fase; e nota da defesa
  de Thiago Miranda. Os eventos da 9ª fase e da Zona Cinzenta deixaram de ser corroborados por
  imprensa e passaram a ser documentais.
- Retratos de 37 pessoas e marcas de 13 organizações, do Wikimedia Commons, com autoria, licença e
  link para o arquivo original exibidos junto da imagem; coletor em `python/novelo_osint/fotos.py`
  recusa licença não livre, imagem que não seja marca própria e arquivo repetido entre entidades.
- Link direto para uma conexão (`/grafo?e=<id>`), compartilhável e coberto por teste de ponta a ponta
  que verifica títulos de fonte e contraditório no card.
- Camada probatória opcional no grafo, com nós de documentos, fontes, claims e evidências e vínculos
  explícitos de rastreabilidade; expansão até o 3º grau com contagem prévia; física contínua, arraste,
  fixação, restauração e rotação do mapa; job semanal/manual de stress com 5.000 nós e 25.000 arestas.
- Lote 6 do corpus: financiamento do filme "Dark Horse" (Flávio, Eduardo e Jair Bolsonaro, Mário Frias,
  Thiago Miranda, Go Up Entertainment, Havengate Development Fund, Entre Investimentos; 10ª fase da
  Compliance Zero), Resort Tayayá e Maridt (Toffoli), pagamentos do Master à Consult Inteligência
  Tributária e ao escritório do filho de Nunes Marques (Coaf), Reag/Mansur, Will Financeira, Banco Pleno,
  Ligga, Amapá Previdência (operação Zona Cinzenta), relatório da PF sobre Jaques Wagner e projeto eólico
  de Fábio Faria; transações (`data/transactions`) passam a ser usadas no corpus real; 4 claims e 3
  sequências temporais novas; contraditório atualizado em Toffoli, Nunes Marques, Alcolumbre, Wagner e Faria.
- Teste unitário de `safeJsonLd`.

### Alterado

- A camada probatória saiu do arquivo principal do grafo e passou a ser baixada sob demanda
  (`public/data/graph-evidence.json`): o carregamento inicial voltou de 1,4 MB para 586 KB.

### Corrigido

- Cards de conexão agora exibem títulos das fontes e o contraditório específico; o recorte temporal
  oculta relações sem data com aviso explícito; rótulos do grafo usam supressão de colisões e truncamento
  visual preservando o texto completo no hover e nos painéis.
- Contraditórios sem autor identificado passaram a nomear quem se manifestou, em vez de "Envolvido".
- `safeJsonLd` não escapava `<` (a string `"<"` em TypeScript já é `<`), permitindo, em tese,
  fechamento prematuro da tag `<script type="application/ld+json">`. Apontado pelo CodeQL
  (`js/identity-replacement`).
- DEPLOYMENT.md sem e-mail pessoal; app do Cloudflare no GitHub restrito ao repositório.

## [0.1.0] - 2026-09-03 (release candidate)

### Adicionado

- Grafo interativo (Sigma.js 3 + Graphology): busca instantânea, card de nó e de aresta, seleção
  múltipla com conexões comuns, eventos compartilhados, intermediários e caminhos entre pares,
  "Como A se conecta a B?" com alternativas, vizinhança em 1º e 2º grau, isolamento, filtros por tipo
  de nó, de relação e classe de evidência, modos "MOSTRAR APENAS FONTES OFICIAIS" e "MOSTRAR SOMENTE
  FATOS DOCUMENTADOS", time machine com "assistir o novelo se formar", antes/depois de eventos,
  legenda (cor = natureza, forma = força), reorganização por ForceAtlas2 em worker, atalhos de teclado.
- Programas WebGL próprios para arestas tracejadas (alegação) e pontilhadas (inferência), com setas.
- Modelo de dados (Zod) com evidência como entidade central e classes D/C/A/I; lint editorial que
  bloqueia relação sem suporte, alegação/inferência com status verificado, classe D sem documento,
  classe C com fonte única e inferência sem raciocínio escrito.
- Pipeline `data:build` (YAML → corpus.json + graph.json com layout pré-calculado) e dataset sintético
  de estresse (5.000 nós / 25.000 arestas).
- Páginas estáticas indexáveis: pessoas, organizações, eventos, atos públicos, documentos, fontes,
  cronologia com filtros, coincidências temporais, atualizações, metodologia, política editorial e
  rede em tabela; sitemap, robots, JSON-LD, OpenGraph.
- Corpus inicial verificado: 44 pessoas, 26 organizações, 43 eventos, 10 atos públicos, 79 relações,
  24 documentos, 58 fontes (21 oficiais), 81 evidências, 4 claims, 3 sequências temporais.
- Documentação: README, ARCHITECTURE, METHODOLOGY, EDITORIAL_POLICY, OSINT_GUIDELINES, DATA_SCHEMA,
  CONTRIBUTING, SECURITY, DEPLOYMENT, ADRs, notas de performance e relatórios de Red Team.
- Segurança: gitleaks no pre-commit e no CI, scanner de fallback, `.env.example`, CSP e cabeçalhos em
  `public/_headers`, CodeQL, dependency review, Dependabot, `npm audit` limpo.
- Testes: 52 unitários (Vitest) e 10 cenários E2E (Playwright).
- Utilitários Python de captura para OSINT (`python/novelo_osint`).

### Corrigido

- Escape de JSON-LD contra fechamento prematuro da tag `script`.
- Datas de publicação de seis fontes conferidas nos metadados das páginas.
- Reunião no Planalto (04/12/2024) reclassificada de C para D após depoimento oficial de Galípolo à CPI.
