# Arquitetura

O Novelo Master é um site estático, sem banco em runtime, cujo produto central é um grafo
interativo de relações documentadas. Esta página descreve como os dados fluem do repositório
até o navegador e onde cada peça vive. As decisões formais estão em [docs/adr](docs/adr/README.md).

## Visão geral

```
data/*.yaml  ──►  scripts/build-data.ts  ──►  src/generated/corpus.json  ──►  páginas pré-renderizadas
   (fonte de           (Zod + lint +              (server components,           /pessoas/[slug] ...
    verdade)            ForceAtlas2)               generateStaticParams)
                              │
                              └──────────►  public/data/graph.json  ──►  /grafo (Sigma.js, client)
```

1. **Fonte de verdade**: `data/<coleção>/<id>.yaml`, um registro por arquivo. O histórico Git é a
   trilha de auditoria editorial.
2. **Compilação**: `npm run data:build` lê, valida (schemas Zod em `src/lib/schema`), aplica o lint
   editorial (`scripts/lib/lint.ts`), monta o grafo e calcula o layout (`scripts/lib/graph.ts`).
   Erros bloqueiam o build. Saídas em `src/generated/` (páginas) e `public/data/graph.json` (grafo).
3. **Site**: Next.js 16 (App Router) com `output: "export"`. Páginas individuais são pré-renderizadas
   e indexáveis; o grafo é client-side e carrega o JSON em runtime.

## Diretórios

| Caminho | Conteúdo |
|---------|----------|
| `data/` | Corpus editorial (people, organizations, events, relationships, claims, sources, documents, public-acts, transactions, evidence, sequences, revisions). |
| `raw/` | Material bruto de pesquisa: briefing dos investigadores, relatórios de cluster, patches propostos. Nada daqui vai ao site sem passar pelo schema. |
| `processed/` | Capturas de páginas e PDFs feitas por `python/novelo_osint/fetch.py` (ignorado no Git). |
| `scripts/` | Pipeline de dados (`build-data.ts`, `validate-data.ts`), dataset sintético (`synth-stress.ts`), scanner de segredos de fallback. |
| `scripts/lib/` | `load.ts` (YAML → registros validados), `lint.ts` (regras editoriais), `graph.ts` (corpus → grafo + layout), `report.ts`. |
| `src/lib/schema/` | Schemas Zod e rótulos pt-BR. Contrato único usado pelo pipeline e pelo site. |
| `src/lib/data/` | Acesso ao corpus compilado nas páginas (server-only). |
| `src/lib/graph/` | Contrato do grafo (`types.ts`), construção do Graphology, algoritmos (caminhos, vizinhança, filtros), estilos e programas WebGL. |
| `src/components/graph/` | Canvas Sigma, explorador, cards de nó e aresta, filtros, legenda, seleção múltipla, caminho mínimo, time machine, antes/depois. |
| `src/components/entity/` | Componentes das páginas individuais (evidência, fontes, posição do citado, timeline, relação). |
| `src/app/` | Rotas: `/`, `/grafo`, `/pessoas`, `/organizacoes`, `/eventos`, `/documentos`, `/fontes`, `/atos`, `/cronologia`, `/coincidencias`, `/atualizacoes`, `/metodologia`, `/politica-editorial`, `/rede`, sitemap e robots. |
| `python/novelo_osint/` | Utilitários de captura para OSINT (curl com IP local, extração de texto de HTML e PDF, metadados de captura). |
| `docs/adr/` | Architecture Decision Records. |
| `tests/` | Unitários (Vitest) em `tests/unit` e `src/**/*.test.ts`; E2E (Playwright) em `tests/e2e`. |
| `.github/` | CI (qualidade, segredos, auditoria, e2e), dependency review, CodeQL, Dependabot, templates de issue e PR. |

## Modelo de dados (resumo)

O elemento fundamental é a **evidência**: uma proposição concreta ligada a documento(s) e fonte(s),
classificada em D (documental direto), C (corroborado), A (alegação) ou I (inferência). Relações,
eventos, atos públicos, transações e claims apontam para evidências. O lint impede que uma relação
seja publicada sem suporte, salvo quando explicitamente classificada como inferência com raciocínio
registrado. Detalhes em [DATA_SCHEMA.md](DATA_SCHEMA.md) e [METHODOLOGY.md](METHODOLOGY.md).

`Company` e `PublicBody` são subtipos de `Organization` (`org_type`), preservados nos filtros do grafo
como categorias distintas.

## Grafo

- **Nós**: pessoas, organizações, eventos e atos públicos. Transações viram arestas financeiras.
- **Arestas**: relações (entidade↔entidade), participação (entidade→evento), atuação (entidade→ato).
  Cada aresta carrega `evidence_class`, `status`, `official` (há fonte primária oficial), `documented`
  (classe D ou C), `since` (data para a time machine), fontes e evidências.
- **Cor = natureza** (família da relação); **forma = força** (D sólida, C sólida curta, A tracejada,
  I pontilhada). Vermelho nunca sinaliza crime.
- **Layout**: ForceAtlas2 determinístico no build; refinamento opcional em Web Worker no cliente.
- **Algoritmos**: caminho mínimo e alternativos, vizinhança em 1º a 3º grau, conexões comuns,
  intermediários e eventos compartilhados, todos em funções puras testadas.
- **Modos**: "somente fontes oficiais" e "somente fatos documentados" são filtros sobre `official` e
  `documented`; a time machine filtra por `since`.

## Segurança

Site estático sem segredos em runtime. `.env.example` versionado, `.env*` ignorado, gitleaks no
pre-commit e no CI, scanner de fallback (`npm run scan:secrets`), auditoria de dependências e CodeQL.
Cabeçalhos de segurança são aplicados pelo host (`public/_headers`, ver [DEPLOYMENT.md](DEPLOYMENT.md)).

## Evolução prevista

- **Banco de dados**: os schemas Zod permitem derivar DDL para PostgreSQL/Supabase sem alterar o
  contrato das páginas; o pipeline passaria a ler do banco em vez do YAML.
- **Fotos**: `PhotoSchema` já exige origem, autor, licença, URL e data; a V1 usa avatares neutros.
- **Corpus**: novos clusters de pesquisa entram por PR de dados com o gauntlet editorial descrito em
  [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md).
