# Changelog

Todas as mudanças relevantes neste projeto são registradas aqui. O formato segue [Keep a Changelog 1.1.0](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

Mudanças no corpus (`data/`) são registradas de forma resumida nesta página e, para o público, em `data/revisions/` (página `/atualizacoes`). Correções e retratações editoriais entram sempre na seção "Corrigido" ou "Removido", sem reproduzir conteúdo retratado.

## [Unreleased]

### Adicionado

- Estrutura inicial do repositório independente com Git como fonte de verdade editorial (ADR-0001).
- Next.js 16 com exportação estática, sem servidor nem banco em runtime (ADR-0002).
- Modelo de dados em Zod (`src/lib/schema/`): Person, Organization (com `org_type`), Event, PublicAct, Transaction, Relationship, Claim, Evidence, Source, Document, TemporalSequence e Revision; classes de evidência D/C/A/I; status factual; trilha de revisão; `cited_position` para contraditório; metadados obrigatórios de foto (ADR-0003).
- Pipeline de dados: carregador YAML (um registro por arquivo), lint editorial com erros bloqueantes e avisos, compilação para `corpus.json`, `stats.json` e `graph.json` com layout ForceAtlas2 determinístico; comandos `data:validate`, `data:lint`, `data:build`, `data:stress`.
- Grafo com Sigma.js 3 e Graphology; flags `official` e `documented` por aresta para os modos "somente fontes oficiais" e "somente fatos documentados" (ADR-0004).
- Segurança: `.gitignore` para segredos e artefatos, `.gitleaks.toml`, hook de pre-commit com gitleaks e scanner de fallback (`scripts/scan-secrets.ts`), `.env.example`.
- Documentação: METHODOLOGY.md, EDITORIAL_POLICY.md, OSINT_GUIDELINES.md, DATA_SCHEMA.md, CONTRIBUTING.md, SECURITY.md, ADRs 0001 a 0004, modelos de issue e de pull request.
- Página inicial: (a preencher)
- Grafo interativo com filtros por categoria, família e classe de evidência: (a preencher)
- Máquina do tempo: (a preencher)
- Páginas de pessoa, organização, evento e ato público: (a preencher)
- Página `/coincidencias` (sequências temporais): (a preencher)
- Página `/atualizacoes` (revisões): (a preencher)
- Página `/metodologia`: (a preencher)
- Busca: (a preencher)
- Testes unitários e end-to-end: (a preencher)
- Integração contínua: (a preencher)

### Alterado

- (nada ainda)

### Corrigido

- (nada ainda)

### Removido

- (nada ainda)

### Segurança

- (nada ainda)

### Corpus

- Carga inicial de dados: (a preencher com a primeira revisão em `data/revisions/`)

[Unreleased]: https://github.com/rfausel-lgtm/o-novelo-master/compare/main...HEAD
