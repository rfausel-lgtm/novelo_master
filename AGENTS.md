<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Publicação de lote: a cadeia de gatilhos

Publicar um lote não termina no `git push`. Quem publica aciona o elo seguinte na mesma sessão —
nada nesta cadeia depende de alguém lembrar depois.

1. **Publicar o lote.** `npm run data:lint -- --strict` e `npm run build`, ambos com saída 0 (conferir
   o código de saída, não o texto), commit com o `data/revisions/*.yaml` do lote, push na `main`. O
   Cloudflare Pages reconstrói o site a cada push na `main` e `/atualizacoes` já abre com as dez
   atualizações mais recentes no topo — nenhuma curadoria manual entra aqui.
2. **A arte padrão já vem sozinha.** O workflow
   [`card-de-lote.yml`](.github/workflows/card-de-lote.yml) dispara no push de `data/revisions/**`
   na `main`, gera o **card** de toda revisão sem arte e o commita de volta. O card é função do
   `Revision.id` — mesmo id, mesmo desenho —, não usa modelo de imagem nenhum, custa cerca de um
   segundo por peça e vale para 100% das revisões. Quem publica lote não precisa acionar nada, e
   quem quiser antecipar roda `npm run social:cards` antes do push.

   O card **não é ilustração** e **não aparece em `/atualizacoes`**: `public/social/cards.json`
   registra quais artes são cards, e a lista mostra só as ilustrações — o card repetia, ao lado, o
   título que o item já traz em texto. Decisão de Rafael em 12/09/2026. "Ilustração gerada por IA" é
   verdade sobre a cena que o Codex pinta e é falsa sobre um card, que só compõe o título já
   aprovado pelo acervo.

3. **A ilustração do Codex virou melhoria opcional.** Quando você quiser uma cena para um lote,
   a sessão dispara o agente de arte do Codex passando o **`Revision.id` completo** — nunca o número do lote, que não identifica revisão
   neste acervo ([docs/ARTE-DE-LOTE.md](docs/ARTE-DE-LOTE.md)). Como recuperação independente dessa
   sessão, a automação local `Novelo — artes de lotes novos` (Codex, `~/.codex/automations/`, a cada
   **10 minutos**) consulta `npm run social:pending -- --since-lot 200 --limit 10 --json`. O marco é
   obrigatório: ela nunca importa o histórico anterior ao lote 200. Esse agente gera a arte, roda
   `npm run social:check` e grava o arquivo canônico `public/social/<Revision.id>.webp`.

   **Por que a automação não fecha sozinha, medido em 12/09/2026.** Ela gera e valida em minutos,
   mas o `gh` desta máquina autentica pelo **keyring do Windows** e o ambiente isolado dela não
   alcança o keyring: `gh` responde 401 e o PR nunca é aberto. O push direto também não sai, barrado
   pelo controle de segurança do próprio Codex — não pelo GitHub, cujo ruleset `proteger-main` só
   impede deleção e force-push. Resultado: arte pronta parada em branch até alguém abrir o PR à mão.
   Foi isso, e não lentidão de geração, que produziu latências de até 44 h nos lotes 136–165.

   **E por que ela agora fica quase sempre parada.** `social:pending` considera concluída toda
   revisão com arquivo canônico, card inclusive. Com o card cobrindo tudo, a automação não encontra
   pendência e não roda — de propósito. A ilustração passa a ser pedida caso a caso, e entra por
   `npm run social:add -- <arquivo> <lote>`, que sobrescreve o card e tira o id do manifesto.

4. **Levar a ilustração até a `main`.** Gerar não é publicar. Quem fecha essa ponte é o workflow
   [`.github/workflows/arte-de-lote.yml`](.github/workflows/arte-de-lote.yml): ele dispara no push de
   qualquer branch `codex/**`, confere que o diff contra a `main` é **exclusivamente** arte (ao menos
   um `public/social/*.webp` novo e nada fora dele e do `CHANGELOG.md`), roda `social:check`,
   `data:lint` estrito e `build`, e só então commita os `.webp` novos direto na `main`. O token é o do
   próprio Actions, o que dispensa credencial nova na máquina. Branch que toque `src/`, `scripts/`,
   `data/` ou `.github/` é ignorada em silêncio: código e dado passam por gente.

   **Sem PR, e por dois motivos medidos.** PR aberto com o `GITHUB_TOKEN` não dispara o evento
   `pull_request` (restrição do GitHub contra laço infinito de workflows), então nasceria sem
   verificação nenhuma — por isso as validações rodam dentro do próprio workflow. E abrir PR pelo
   Actions esbarra em `GitHub Actions is not permitted to create or approve pull requests`,
   configuração de repositório desligada: foi assim que a primeira execução real falhou
   (run 34664172083). O `proteger-main` não exige PR — só impede deleção e force-push —, então a
   entrega direta é legítima, e o rastro fica no commit e no log da execução.

   **A entrega copia arquivo a arquivo, nunca a pasta.** `git checkout <ref> -- public/social/`
   traria a pasta como está na branch e apagaria da `main` a arte que chegou depois que a branch
   nasceu. E a `main` anda o tempo todo: por isso, se ela andar durante a entrega, o passo se refaz
   sobre a `main` nova, até cinco vezes, em vez de falhar.

   O que não mudou: o site é construído a partir da `main`, então arte parada em branch não existe
   para o leitor — e branch parada foi exatamente como as artes dos lotes 156 a 164 ficaram um dia
   inteiro fora do ar. O agente fecha o trabalho com `social:check` verde e a branch empurrada, nunca
   abandonada; o workflow faz o resto. A liberação obedece ao que a
   seção 7.1 da [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md) exigir no momento. Rafael concedeu
   autorização editorial continuada para liberação automática das artes: o agente inspeciona a
   imagem, registra o checklist no PR, espera todas as verificações obrigatórias e, estando tudo
   conforme, mescla o próprio PR. Dúvida sobre qualquer vedação editorial bloqueia a publicação e
   exige aviso ao editor.

5. **Rascunho para o X.** Só depois que a arte está na `main` o post do lote fica completo — antes
   disso o rascunho apontaria para uma imagem que o site não serve. Aí o fluxo do Codex salva o
   rascunho no buffer, via API, para aprovação.

## O que não se dobra

- **Nada é publicado no X sem aprovação humana explícita.** A cadeia automatiza até o rascunho e para
  ali. Um agente nunca aperta o botão de publicar.
- **O gatilho nunca bloqueia a publicação de dados.** Ausência de arte é estado normal, não pendência:
  se a geração de arte falhar, o lote continua publicado e correto. Dado publicado não espera imagem.
- **Detecção é idempotente e recuperável.** A presença de `public/social/<Revision.id>.webp` na
  `main` é o estado durável de conclusão. Revisão sem arquivo continua pendente para a próxima
  execução; revisão com arte nunca é refeita. Antes de gerar, a automação também procura PR aberto
  para o mesmo `Revision.id`, para não duplicar trabalho ainda em conferência.
- **Autoaprovação não reduz o padrão editorial.** Ela decorre da autorização continuada registrada na
  seção 7.1, não de autorização criada pelo agente. O agente ainda precisa conferir e registrar cada
  item do checklist; qualquer dúvida sobre rosto de pessoa real, retrato fotorrealista, simulação de
  documento ou de cena fora da exceção cenográfica expressa na seção 7.1, alegação nova ou animação
  interrompe o fluxo.
- **Ninguém commita na branch alheia.** A equipe de arte trabalha em worktree próprio e traz a `main`
  para dentro; a equipe de investigação publica na `main` sem parar para esperar arte. As duas correm
  em paralelo de propósito — antes de editar código, verifique se o worktree já tem trabalho não
  commitado de outra sessão, e nunca o entrelace com o seu.
- **Conflito no `CHANGELOG.md` é esperado, não é acidente.** As duas equipes escrevem no mesmo bloco
  `Unreleased`, e trazer a `main` para dentro colide ali com frequência. Resolve-se **mantendo as duas
  entradas** — descartar a da outra equipe apaga trabalho alheio do histórico.
- **Não se abandona worktree no meio de um merge.** Merge iniciado se conclui ou se aborta
  (`git merge --abort`) antes de a sessão encerrar. Worktree parado em conflito vira armadilha para a
  próxima sessão, que o encontra sem saber de quem é nem em que pé está.
