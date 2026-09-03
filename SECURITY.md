# Política de segurança

O Novelo Master é um site estático gerado a partir de dados públicos. A superfície de ataque é pequena, mas existem três riscos que esta política cobre: vazamento de segredos no repositório, dependências vulneráveis e publicação de dado pessoal indevido.

## Divulgação responsável

Encontrou vulnerabilidade no código, no pipeline, no site publicado ou nas configurações do repositório?

1. Não abra issue pública com detalhes exploráveis.
2. Abra um relatório privado em GitHub Security Advisories: na página do repositório, aba Security, "Report a vulnerability" (`<url-do-repositorio>/security/advisories/new`). O repositório de referência está declarado em `src/lib/site.ts` (`SITE.repository`).
3. Se a funcionalidade de advisories não estiver disponível, abra uma issue com o modelo "Segurança" (`.github/ISSUE_TEMPLATE/security.yml`) contendo apenas o tipo do problema e um pedido de contato; os detalhes serão trocados em canal privado indicado pelos mantenedores.

Compromisso dos mantenedores: confirmar o recebimento em até 7 dias, avaliar e responder com plano em até 30 dias, creditar quem reportou (se desejar) no changelog após a correção. Não há programa de recompensas.

Este projeto não publica endereço de e-mail para reporte; qualquer e-mail que se apresente como canal oficial de segurança do Novelo deve ser tratado com desconfiança.

## O que é segredo

Qualquer valor que dê acesso a um serviço ou identifique unicamente uma sessão: chaves de API (Anthropic, OpenAI, Google, AWS, Supabase, Cloudflare), tokens do GitHub, tokens de bots (Telegram, Slack), senhas, strings de conexão com senha, chaves privadas (PEM, SSH), cookies e arquivos de sessão, arquivos `credentials*.json`, `client_secret*.json`, `token*.json`, `.har` (que carregam cookies e cabeçalhos).

O `.gitignore` já exclui esses padrões. Os únicos arquivos de configuração versionados são exemplos sem valores reais.

## `.env.example` e `.env`

- `.env.example` é versionado e contém apenas nomes de variáveis com valores vazios ou de exemplo. Está na allowlist do gitleaks por isso.
- `.env`, `.env.local` e qualquer `.env.*` são ignorados pelo Git e bloqueados pelo hook de pre-commit se entrarem no índice.
- As variáveis atuais (`NEXT_PUBLIC_SITE_URL`, `NOVELO_INCLUDE_DRAFTS`) não são segredos. Se uma variável sensível for adicionada no futuro, ela vai para `.env.local`, nunca para `NEXT_PUBLIC_*` (que é embutido no bundle público).

## Varredura de segredos

Três camadas:

1. Pre-commit (`.githooks/pre-commit`, ativado com `git config core.hooksPath .githooks`): bloqueia `.env*` no índice e roda `gitleaks protect --staged --redact --config .gitleaks.toml`. Sem gitleaks instalado, roda `npm run scan:secrets -- --staged` (scanner de fallback em `scripts/scan-secrets.ts`, que cobre chaves AWS, Anthropic, OpenAI, GitHub, Slack, Google, JWTs de Supabase, blocos de chave privada, atribuições genéricas de segredo e strings de conexão com senha).
2. Integração contínua: `gitleaks detect` sobre o histórico do PR e `npm run scan:secrets` sobre os arquivos rastreados.
3. `.gitleaks.toml` usa o conjunto de regras padrão do gitleaks e só adiciona allowlist para `package-lock.json`, o próprio arquivo de configuração e `.env.example`. Não acrescente caminhos à allowlist sem justificativa no PR.

Nenhum scanner imprime o valor do segredo encontrado; apenas arquivo e linha.

### O que fazer se um segredo vazou

1. Revogue o segredo no serviço de origem imediatamente. Isso vale mesmo que o commit ainda não tenha sido enviado: considere comprometido.
2. Remova do histórico (`git filter-repo` ou BFG) e force o push na branch afetada, avisando os mantenedores. Se já foi mesclado em `main`, reporte via advisory para coordenação.
3. Registre a ocorrência no changelog sem o valor.

## Cabeçalhos de segurança do host

O site é exportado estaticamente ([ADR-0002](docs/adr/0002-next-static-export.md)), então `next.config.ts` não define cabeçalhos; eles são configurados no host. A ADR prevê `public/_headers` (Cloudflare Pages, Netlify) e um `DEPLOYMENT.md` com o equivalente para nginx. Cabeçalhos esperados em produção:

- `Content-Security-Policy` restritiva: `default-src 'self'`; scripts e estilos do próprio domínio (com os ajustes que o Next e o Sigma exigirem); `img-src 'self' data:`; `connect-src 'self'`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` negando câmera, microfone, geolocalização e sensores.
- `poweredByHeader: false` já está em `next.config.ts`.

O site não usa cookies, não tem autenticação e não recebe dados do visitante. Qualquer funcionalidade futura que colete dados exige revisão desta política.

## Dependências

- `npm audit` faz parte da rotina de revisão; vulnerabilidades altas ou críticas em dependências de produção bloqueiam o merge até correção ou justificativa registrada.
- A CI executa GitHub Dependency Review em pull requests que alteram `package.json` ou `package-lock.json`.
- Atualizações de dependência chegam por Dependabot ou por branch `security/*`; PRs de dependência não misturam outras mudanças.
- Nenhuma dependência nova sem justificativa no PR. Bibliotecas de terceiros carregadas em runtime a partir de CDN externo não são permitidas (conflitam com a CSP e com a reprodutibilidade do build).

## Dado pessoal indevido

Se encontrar no site ou no repositório dado pessoal vedado pela [política editorial](EDITORIAL_POLICY.md#6-dados-pessoais) (telefone pessoal, endereço residencial, CPF, dado de saúde, dado de menor, mensagem privada além do trecho público), ou registro sobre pessoa que não atende aos critérios de inclusão:

1. Não reproduza o dado em issue pública.
2. Reporte por GitHub Security Advisories (mesmo canal de vulnerabilidades) informando o id do registro ou a URL da página e o tipo de dado, sem o valor. Se for a própria pessoa citada, diga isso.
3. Os mantenedores removem o dado do build, marcam o registro como `retracted` ou corrigem o campo, e, quando a permanência do texto no histórico for ela mesma indevida, reescrevem o histórico Git e registram a remoção no changelog sem reproduzir o conteúdo.
4. Prazo: remoção do site na primeira publicação após a confirmação, com meta de 72 horas; resposta ao solicitante conforme [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md#9-pedidos-de-remoção-e-de-resposta).

## Escopo fora desta política

- Conteúdo de sites de terceiros linkados como fonte.
- Cópias do site hospedadas por terceiros.
- Pedidos de correção factual que não envolvem dado pessoal: usar a issue "Correção de dado".
