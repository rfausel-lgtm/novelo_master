# ADR-0002 — Next.js App Router com exportação estática

**Data:** 2026-09-03 · **Status:** aceito

## Contexto
A V1 não precisa de servidor: o corpus é pequeno (centenas a poucos milhares de registros),
muda por commit e deve ser indexável.

## Decisão
- `output: "export"` no Next 16. Páginas individuais (`/pessoas/[slug]` etc.) são pré-renderizadas
  com `generateStaticParams` a partir de `src/generated/corpus.json`.
- O grafo é client-side e consome `public/data/graph.json` (com layout ForceAtlas2 pré-calculado).
- Headers de segurança ficam em `public/_headers` (Cloudflare Pages/Netlify) e documentados em
  `DEPLOYMENT.md` para nginx.

## Consequências
- Deploy em qualquer host estático (Cloudflare Pages, GitHub Pages, VPS/nginx). Sem custo de runtime.
- `next.config` não pode usar `headers()`/`redirects()`; feito no host.
- Se no futuro houver busca server-side ou dados dinâmicos, trocar para output padrão é trivial.
