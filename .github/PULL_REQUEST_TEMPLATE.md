# Pull request

## Resumo

<!-- O que muda e por quê, em duas ou três linhas. Referencie issues com "Closes #N". -->

## Tipo

- [ ] Código (site, pipeline, scripts, testes)
- [ ] Dados (`data/`, `raw/`, `processed/`)
- [ ] Documentação
- [ ] Segurança / dependências

## Checklist de código

- [ ] `git pull --rebase origin main` feito nesta branch
- [ ] `npm run typecheck` passa
- [ ] `npm run lint` passa
- [ ] `npm run test` passa (e testes novos cobrem a mudança, quando aplicável)
- [ ] `npm run data:lint` passa
- [ ] `npm run scan:secrets` (ou `gitleaks detect`) sem ocorrências
- [ ] Nenhuma dependência nova sem justificativa abaixo
- [ ] Mudança de schema ou de lint refletida em `DATA_SCHEMA.md` e, se muda regra editorial, em `METHODOLOGY.md` / `EDITORIAL_POLICY.md`
- [ ] Entrada em `CHANGELOG.md` (seção Unreleased)

## Seção de dados

<!-- Preencher para cada registro novo ou alterado. Apagar a seção se o PR não toca data/. -->

| Registro (id) | Fonte (id / URL aberta) | Data do fato | Data de publicação | Classe (D/C/A/I) | Justificativa da classe |
| ------------- | ----------------------- | ------------ | ------------------ | ---------------- | ----------------------- |
|               |                         |              |                    |                  |                         |

Explicação (a proposição concreta que cada registro sustenta e o que ele não afirma):

<!-- texto -->

- [ ] Toda URL registrada foi aberta e lida por mim; `retrieved_at` e, quando possível, `archive_url` preenchidos
- [ ] Fontes com bloco `verification` preenchido por pessoa diferente de quem registrou (ou marcadas `in_review` até isso ocorrer)
- [ ] Evidências na classe correta: D com documento, C com duas fontes independentes, A com `attributed_to`, I com `inference_basis` e limites
- [ ] Nenhuma relação criada por mera aparição conjunta; cada uma tem `label`, `description` e suporte
- [ ] Nenhum registro de classe A ou I com `status: verified`
- [ ] `why_in_novelo` em uma frase factual e neutra para cada pessoa e organização
- [ ] Contraditório registrado? `cited_position` preenchido para cada pessoa e organização (ainda que `not_located`, com descrição da busca) e para relações, eventos e transações quando houver posição sobre o fato específico
- [ ] Nenhum dado pessoal vedado (telefone, endereço residencial, CPF, dados sensíveis, dados de menores)
- [ ] Fotos com `source`, `author`, `license`, `original_url`, `retrieved_at`, `alt`
- [ ] Homônimos verificados
- [ ] `npm run data:lint` passou sem erros nem avisos
- [ ] Registros a publicar têm `reviewer` e `reviewed_at`; os demais estão em `draft` ou `in_review`
- [ ] Entrada em `data/revisions/` para mudanças materiais (inclusões, correções, retratações)

## Conflito de interesse

<!-- Declare vínculo com pessoa ou organização citada nos registros deste PR, ou escreva "nenhum". -->

## Segredos

- [ ] Não há token, chave, senha, cookie, arquivo `.env` ou credencial neste PR nem na descrição
