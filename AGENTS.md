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
   neste acervo ([docs/ARTE-DE-LOTE.md](docs/ARTE-DE-LOTE.md)). Esse agente gera a arte, roda
   `npm run social:check` e grava o arquivo canônico `public/social/<Revision.id>.webp`. A liberação
   obedece ao que a seção 7.1 da [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md) exigir no momento:
   conferência humana específica ou, onde houver autorização continuada registrada no repositório,
   publicação direta pelo agente depois das validações mecânicas.
3. **Rascunho para o X.** Com a arte publicada, o post do lote fica completo e o fluxo do Codex salva
   o rascunho no buffer, via API, para aprovação.

## O que não se dobra

- **Nada é publicado no X sem aprovação humana explícita.** A cadeia automatiza até o rascunho e para
  ali. Um agente nunca aperta o botão de publicar.
- **O gatilho nunca bloqueia a publicação de dados.** Ausência de arte é estado normal, não pendência:
  se o passo 2 falhar, o lote continua publicado e correto. Dado publicado não espera imagem.
- **Autorização não se inventa.** O agente que gera a arte não cria autorização própria nem afasta as
  vedações da seção 7.1 (rosto de pessoa real, retrato fotorrealista, simulação de documento ou de
  cena, alegação nova, animação).
- **Ninguém commita na branch alheia.** A equipe de arte trabalha em worktree próprio e traz a `main`
  para dentro; a equipe de investigação publica na `main` sem parar para esperar arte. As duas correm
  em paralelo de propósito — antes de editar código, verifique se o worktree já tem trabalho não
  commitado de outra sessão, e nunca o entrelace com o seu.
