#!/usr/bin/env bash
#
# Auditoria noturna do Novelo Master — o que o cron da máquina que hospeda a rotina chama.
# Desenho e limites em docs/AUDITORIA_NOTURNA.md. Só relata: nada aqui escreve no repositório
# publicado, commita ou publica.
#
# Configuração (fora do repositório): $NOVELO_AUDITORIA_BASE/config.env, com os nomes listados no
# documento. Interruptor: criar o arquivo $NOVELO_AUDITORIA_BASE/DESLIGADA suspende a rotina sem
# mexer no cron.

set -uo pipefail

BASE="${NOVELO_AUDITORIA_BASE:-$HOME/novelo-auditoria}"
# shellcheck disable=SC1091
[ -f "$BASE/config.env" ] && . "$BASE/config.env"

if [ -e "$BASE/DESLIGADA" ]; then
  echo "auditoria desligada ($BASE/DESLIGADA)"
  exit 0
fi

REPO="$BASE/repo"
EST="$BASE/estado"
REL="$BASE/relatorios"
LOGS="$BASE/logs"
mkdir -p "$EST" "$REL" "$LOGS" "$BASE/cache"

exec 9>"$BASE/.trava"
if ! flock -n 9; then
  echo "outra execução em andamento"
  exit 0
fi

DATA="$(date +%F)"
IMAGEM="${NOVELO_AUDITORIA_IMAGEM:-node:24-bookworm}"
URL_REPO="${NOVELO_AUDITORIA_REPO_URL:-https://github.com/rfausel-lgtm/novelo_master.git}"

avisar_falha() {
  # A rotina que quebra avisa: silêncio numa noite de falha seria lido como noite limpa.
  node "$REPO/scripts/auditoria-noturna/noite.mjs" --aviso "Auditoria noturna $DATA falhou: $1. Log em $LOGS." ||
    echo "também não foi possível avisar pelo Telegram" >&2
  exit 1
}

# 1. A main publicada, não uma cópia de trabalho. Clone por https público: a rotina não precisa de
#    credencial do GitHub, e não ter uma é a garantia de que não empurra nada.
if [ ! -d "$REPO/.git" ]; then
  git clone -q "$URL_REPO" "$REPO" || { echo "clone falhou" >&2; exit 1; }
fi
git -C "$REPO" fetch -q origin main &&
  git -C "$REPO" reset -q --hard origin/main &&
  git -C "$REPO" clean -qfdx -e node_modules ||
  avisar_falha "não consegui atualizar o repositório"

# 2. Camada determinística e seleção da noite, no contêiner com o Node que o projeto exige. A seleção
#    grava num estado PROVISÓRIO; ele só vira definitivo se a revisão por IA terminar (noite.mjs).
if [ -f "$EST/estado.json" ]; then
  cp "$EST/estado.json" "$EST/selecao-provisoria.json"
else
  rm -f "$EST/selecao-provisoria.json"
fi

timeout 60m docker run --rm \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp -e npm_config_cache=/cache/npm -e NEXT_TELEMETRY_DISABLED=1 \
  -v "$REPO:/repo" -v "$EST:/estado" -v "$BASE/cache:/cache" \
  -w /repo "$IMAGEM" bash -c "
    set -e
    git config --global --add safe.directory /repo
    npm ci --no-audit --no-fund --loglevel=error
    npm run -s auditoria -- --json --estado /estado/links.json --saida /estado/det-$DATA.json > /dev/null
    npm run -s auditoria:selecao -- --estado /estado/selecao-provisoria.json --escrever-estado --json > /estado/sel-$DATA.json
  " >"$LOGS/$DATA-deterministica.log" 2>&1 ||
  avisar_falha "a camada determinística não terminou"

# 3. Revisão por IA, verificação adversarial, comparação com a noite anterior e Telegram.
timeout 55m node "$REPO/scripts/auditoria-noturna/noite.mjs" --data "$DATA" \
  >"$LOGS/$DATA-noite.log" 2>&1 ||
  avisar_falha "a etapa de revisão não terminou"

# Relatórios e logs com mais de 60 dias saem; o estado e o cache ficam.
find "$REL" "$LOGS" -type f -mtime +60 -delete 2>/dev/null
find "$EST" -name 'det-*.json' -mtime +14 -delete 2>/dev/null
find "$EST" -name 'sel-*.json' -mtime +14 -delete 2>/dev/null
exit 0
