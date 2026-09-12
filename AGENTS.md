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
2. **Acionar a arte.** Logo após o push, a própria sessão que publicou dispara o agente de arte do
   Codex passando o **`Revision.id` completo** — nunca o número do lote, que não identifica revisão
   neste acervo ([docs/ARTE-DE-LOTE.md](docs/ARTE-DE-LOTE.md)). Como recuperação independente dessa
   sessão, a automação local `Novelo — artes de lotes novos` (Codex, `~/.codex/automations/`, a cada
   **10 minutos**) consulta `npm run social:pending -- --since-lot 200 --limit 10 --json`. O marco é
   obrigatório: ela nunca importa o histórico anterior ao lote 200. Esse agente gera a arte, roda
   `npm run social:check` e grava o arquivo canônico `public/social/<Revision.id>.webp`.

   **Gargalo conhecido, medido em 12/09/2026.** A automação gera e valida em minutos, mas não
   consegue concluir sozinha: o `gh` desta máquina autentica pelo **keyring do Windows**, e o
   ambiente isolado dela não alcança o keyring — `gh` responde 401, o PR não é aberto, e o push
   direto na `main` é recusado pelo ruleset `proteger-main`, que exige PR com verificações. O
   resultado é arte pronta parada em branch até alguém abrir o PR à mão. Foi isso, e não lentidão de
   geração, que produziu latências de até 44 h nos lotes 136–165: a mediana é 3 h, mas a arte chega
   em levas, quando alguém percebe. Enquanto o `gh` da automação não autenticar, o passo 3 depende de
   gente.

3. **Levar a arte até a `main`.** Gerar não é publicar. O site é construído a partir da `main`, então
   arte parada em branch não existe para o leitor — e branch parada foi exatamente como as artes dos
   lotes 156 a 164 ficaram um dia inteiro fora do ar. O agente fecha o trabalho com `social:check`
   verde e **PR aberto para a `main`**, nunca com a branch abandonada. A liberação obedece ao que a
   seção 7.1 da [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md) exigir no momento. Rafael concedeu
   autorização editorial continuada para liberação automática das artes: o agente inspeciona a
   imagem, registra o checklist no PR, espera todas as verificações obrigatórias e, estando tudo
   conforme, mescla o próprio PR. Dúvida sobre qualquer vedação editorial bloqueia a publicação e
   exige aviso ao editor.
4. **Rascunho para o X.** Só depois que a arte está na `main` o post do lote fica completo — antes
   disso o rascunho apontaria para uma imagem que o site não serve. Aí o fluxo do Codex salva o
   rascunho no buffer, via API, para aprovação.

## O que não se dobra

- **Nada é publicado no X sem aprovação humana explícita.** A cadeia automatiza até o rascunho e para
  ali. Um agente nunca aperta o botão de publicar.
- **O gatilho nunca bloqueia a publicação de dados.** Ausência de arte é estado normal, não pendência:
  se o passo 2 falhar, o lote continua publicado e correto. Dado publicado não espera imagem.
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
