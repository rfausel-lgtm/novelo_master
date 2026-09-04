"""Candidatos de retrato no banco de fotos da Agência Brasil (EBC).

Por que existe, além do Commons: a EBC publica seu conteúdo sob Creative Commons Attribution 3.0
Brasil e mantém um banco com mais de 200 mil fotos de cobertura jornalística — audiências, coletivas,
posses. É onde estão os diretores do Banco Central, procuradores e delegados que não têm artigo na
Wikipédia nem arquivo no Commons.

O que este script NÃO faz: baixar. Ele só levanta candidatos para conferência humana, porque a busca
é por legenda e devolve foto de coletiva, de plenário e de homônimo com a mesma facilidade com que
devolve retrato.

Ressalva de licença: a licença livre cobre o material produzido pela própria EBC. Fotos vindas de
acordo com agências internacionais têm direitos reservados. Por isso só entra candidato cujo crédito
mencione a Agência Brasil ou a EBC.

Uso:
    python python/novelo_osint/fotos_agenciabrasil.py saida.json
"""

from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "people"
BASE = "https://agenciabrasil.ebc.com.br"
UA = "NoveloMasterBot/0.1 (https://novelo-master.fausel.adv.br; contato via GitHub) urllib"

CREDITO_LIVRE = re.compile(r"ag[eê]ncia brasil|/ebc\b|\bebc\b", re.I)
# Mesmas situações vedadas pela política editorial que o coletor do Commons recusa.
VEDADO = re.compile(
    r"algem|pris(ão|ao)|preso|detid|custódia|custodia|viatura|cadeia|"
    r"filh[oa]s?\b|menor de idade|criança|crianca",
    re.I,
)


def buscar(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", errors="replace")


def meta(pagina: str, propriedade: str) -> str:
    m = re.search(
        rf'<meta[^>]+(?:property|name)="{re.escape(propriedade)}"[^>]+content="([^"]*)"', pagina
    )
    return html.unescape(m.group(1)).strip() if m else ""


def original(url_renderizada: str) -> str:
    """O CDN embute a URL do arquivo original depois do tamanho: .../1600x800/<url original>."""
    m = re.search(r"/\d+x\d+/(https?://.+)$", url_renderizada)
    return (m.group(1).split("?")[0]) if m else url_renderizada


def candidatos(nome: str, limite: int = 4) -> list[dict]:
    busca = buscar(f"{BASE}/search?term={urllib.parse.quote(nome)}")
    caminhos = []
    for c in re.findall(r'href="(/foto/[^"]+)"', busca):
        if c not in caminhos:
            caminhos.append(c)
    saida: list[dict] = []
    for caminho in caminhos[: limite * 3]:
        if len(saida) >= limite:
            break
        try:
            pagina = buscar(BASE + caminho)
        except Exception:
            continue
        imagem = meta(pagina, "og:image")
        if not imagem:
            continue
        legenda = meta(pagina, "og:title") or ""
        descricao = meta(pagina, "og:description") or ""
        credito = ""
        m = re.search(r"Foto:\s*([^\"<]{3,90})", pagina)
        if m:
            credito = html.unescape(m.group(1)).strip()
        if not CREDITO_LIVRE.search(credito):
            continue
        if VEDADO.search(f"{legenda} {descricao}"):
            continue
        saida.append(
            {
                "file": caminho.rsplit("/", 1)[-1],
                "thumb": imagem,
                "arquivo_original": original(imagem),
                "descricao_url": BASE + caminho,
                "autor": credito,
                "licenca": "CC BY 3.0 BR",
                "descricao": (legenda + (" — " + descricao if descricao else ""))[:220],
                "origem": "Agência Brasil",
            }
        )
        time.sleep(0.3)
    return saida


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    destino = Path(sys.argv[1])
    out = []
    for caminho in sorted(DATA.glob("*.yaml")):
        rec = yaml.safe_load(caminho.read_text(encoding="utf-8"))
        if rec.get("photo"):
            continue
        pessoa = {
            "id": rec["id"],
            "nome": rec["name"],
            "papel": rec.get("role", ""),
            "opcoes": [],
        }
        try:
            pessoa["opcoes"] = candidatos(rec.get("full_name") or rec["name"])
        except Exception as exc:
            pessoa["erro"] = str(exc)
        out.append(pessoa)
        print(f"{rec['id']}: {len(pessoa['opcoes'])}")
    destino.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    achou = sum(1 for p in out if p["opcoes"])
    print(f"\n{len(out)} sem foto; {achou} com candidato na Agência Brasil -> {destino}")


if __name__ == "__main__":
    main()
