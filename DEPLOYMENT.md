# Implantação

O site é uma exportação estática do Next.js (`out/`). Não há servidor de aplicação, banco nem
segredos em runtime. Qualquer host de arquivos estáticos serve.

## Build

```bash
npm ci
NEXT_PUBLIC_SITE_URL=https://novelo-master.fausel.adv.br npm run build   # gera out/
```

`NEXT_PUBLIC_SITE_URL` alimenta canonical, sitemap e OpenGraph. Sem ela, o build usa
`https://novelo-master.fausel.adv.br` (valor padrão em `src/lib/site.ts`).

## Cloudflare Pages (em produção)

Estado em 2026-09-03: projeto `novelo-master` criado na conta Cloudflare de rfausel@gmail.com, conectado ao
repositório `rfausel-lgtm/novelo_master` (branch `main`, deploy automático a cada push), build `npm run build`,
saída `out`, variável `NODE_VERSION=24`; preview em `novelo-master.pages.dev` e domínio personalizado
`novelo-master.fausel.adv.br` (CNAME criado pelo próprio Pages). O app GitHub "Cloudflare Workers and Pages"
tem acesso restrito apenas ao repositório `novelo_master`.

1. Conecte o repositório ao Cloudflare Pages.
2. Build command: `npm run build`. Output directory: `out`. Node: 24 (variável `NODE_VERSION=24`).
3. Variável de ambiente: `NEXT_PUBLIC_SITE_URL`.
4. `public/_headers` é copiado para `out/_headers` e aplica CSP e demais cabeçalhos automaticamente.
5. Domínio personalizado: adicione em Custom domains e aponte o DNS (CNAME) conforme instruído.

## GitHub Pages

Adicione um workflow com `actions/configure-pages`, `npm run build` e `actions/upload-pages-artifact`
(path `out`) seguido de `actions/deploy-pages`. Se o site ficar em subcaminho
(`usuario.github.io/repo`), configure `basePath` em `next.config.ts`. GitHub Pages não aplica
`_headers`; os cabeçalhos de segurança ficam limitados aos padrões da plataforma.

## nginx (VPS)

```nginx
server {
    listen 443 ssl http2;
    server_name novelo-master.fausel.adv.br;
    root /var/www/novelo/out;
    index index.html;

    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Cross-Origin-Opener-Policy same-origin always;

    gzip on;
    gzip_types text/html text/css application/javascript application/json image/svg+xml;

    location /_next/static/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
    location /data/ { add_header Cache-Control "public, max-age=300, must-revalidate"; }
    location / { try_files $uri $uri.html $uri/ =404; }
}
```

## Checklist de segurança no GitHub (operador)

- Settings → Code security: ativar Secret scanning e Push protection.
- Branch protection em `main`: exigir os checks `quality`, `data-strict`, `secrets`, `audit`,
  `e2e`; exigir revisão; proibir force-push.
- Dependabot já configurado em `.github/dependabot.yml`; CodeQL em `.github/workflows/codeql.yml`.

## Se um segredo vazar

1. Revogue a credencial no provedor imediatamente.
2. Remova do histórico (`git filter-repo`) e force-push com a equipe avisada.
3. Registre o incidente em SECURITY.md (sem o valor) e rode `gitleaks git .` para confirmar.
