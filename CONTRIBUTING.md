# Como contribuir

O Novelo Master aceita contribuições de dois tipos: dados (fontes, documentos, evidências, entidades, relações) e código (site, pipeline, testes, documentação). As duas passam por pull request, validação automática e revisão. Antes de contribuir com dados, leia [METHODOLOGY.md](METHODOLOGY.md), [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md) e [OSINT_GUIDELINES.md](OSINT_GUIDELINES.md). O modelo de dados está em [DATA_SCHEMA.md](DATA_SCHEMA.md). Questões de segurança seguem [SECURITY.md](SECURITY.md).

## Setup

Requisitos: Node.js 24 (o projeto é desenvolvido com a linha 24.x), npm, Git e, recomendado, [gitleaks](https://github.com/gitleaks/gitleaks).

```bash
git clone <url-do-repositorio>
cd novelo_Master
npm install
git config core.hooksPath .githooks
cp .env.example .env.local
```

Instalação do gitleaks (uma das opções): `winget install gitleaks` (Windows), `brew install gitleaks` (macOS), binário da página de releases do projeto (Linux). Sem gitleaks, o hook de pre-commit usa o scanner de fallback `npm run scan:secrets`, que cobre menos padrões.

Verifique o ambiente:

```bash
npm run check        # typecheck + eslint + data:lint + testes unitários
npm run dev          # compila os dados e sobe o site em http://localhost:3000
```

## Branches

Crie sempre a partir de `main` atualizado. Prefixos:

| Prefixo      | Uso                                                                                  |
| ------------ | ------------------------------------------------------------------------------------ |
| `feat/*`     | Funcionalidade nova no site ou no pipeline                                           |
| `fix/*`      | Correção de bug                                                                      |
| `data/*`     | Inclusão ou alteração de registros em `data/`                                        |
| `research/*` | Pesquisa em andamento: rascunhos (`review_status: draft`), capturas em `raw/`, notas |
| `docs/*`     | Documentação                                                                         |
| `security/*` | Correções de segurança, dependências vulneráveis, remoção de dado indevido           |

Exemplos: `data/fabio-faria`, `feat/time-machine`, `docs/methodology-fontes`.

## Commits

Formato `tipo(escopo): descrição`, no imperativo, em português, sem ponto final. Tipos: `feat`, `fix`, `data`, `docs`, `refactor`, `test`, `chore`, `security`. O escopo é o módulo (`graph`, `schema`, `lint`, `pipeline`, `ui`) ou, em commits de dados, a entidade principal.

```
feat(graph): adicionar filtro "somente fontes oficiais"
data(fabio-faria): registrar nomeação com fonte no DOU
fix(security): remover dependência com CVE aberta
docs(methodology): detalhar exemplos da classe A
```

Um commit por unidade lógica. Em PRs de dados, agrupar por entidade ou por fonte, não por tipo de arquivo.

## Fluxo antes de mesclar

1. `git pull --rebase origin main` na sua branch.
2. `npm run typecheck`, `npm run lint`, `npm run test`.
3. `npm run data:lint` (sem erros e sem avisos; avisos bloqueiam a CI de dados).
4. `npm run scan:secrets` (ou `gitleaks detect --config .gitleaks.toml`).
5. Abrir PR com o modelo preenchido (`.github/PULL_REQUEST_TEMPLATE.md`).
6. Revisão: código exige ao menos uma aprovação; dados exigem o gauntlet descrito em [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md#1-o-gauntlet-editorial), com `reviewer` e `reviewed_at` preenchidos nos registros publicados.
7. Merge por squash ou rebase; nunca merge commit de branch desatualizada.

## PR de dados

Todo PR que toca `data/` informa, para cada registro novo ou alterado:

- Fonte: id do `Source`, URL aberta, `retrieved_at` e, quando houver, `archive_url`.
- Data: do fato e da publicação, distinguidas.
- Classificação de evidência (D, C, A ou I) e por quê.
- Explicação: a proposição concreta que o registro sustenta e o que ele não afirma.
- Contraditório: o que foi encontrado em `cited_position` ou a descrição da busca (`not_located`).
- Resultado de `npm run data:lint`.

PR de dados sem esses itens é devolvido sem revisão de mérito. Registros podem ser enviados em `review_status: draft` ou `in_review` em branches `research/*`; a mudança para `published` é feita pelo revisor.

Use as issues para propor material antes de abrir PR, se preferir: nova fonte, correção de dado, nova relação (`.github/ISSUE_TEMPLATE/`).

## Segredos

Nunca inclua em issue, PR, commit ou comentário: tokens, chaves de API, senhas, cookies, arquivos `.env`, credenciais de qualquer serviço, nem dados pessoais vedados pela [política editorial](EDITORIAL_POLICY.md#6-dados-pessoais). O hook de pre-commit bloqueia `.env*` no índice e roda o gitleaks; a CI repete a varredura. Se um segredo entrar no histórico por engano, siga [SECURITY.md](SECURITY.md#o-que-fazer-se-um-segredo-vazou).

## Código de conduta

- Trate colaboradores e pessoas citadas no corpus com respeito. O Novelo registra fatos e alegações com fonte; não é espaço para opinião sobre culpa de ninguém, nem nas issues.
- Discussões sobre registros se resolvem com documento, não com insistência.
- Assédio, ataques pessoais, divulgação de dados pessoais e tentativas de usar o projeto para perseguir alguém resultam em exclusão do projeto.
- Conflitos de interesse (vínculo com pessoa ou organização citada) devem ser declarados no PR; o colaborador não revisa registros sobre os quais tem conflito.

## Licença

Contribuições são aceitas sob a licença do projeto (MIT para o código, conforme `package.json`). Os dados em `data/` descrevem material público; a licença de fotos é a declarada em cada registro.
