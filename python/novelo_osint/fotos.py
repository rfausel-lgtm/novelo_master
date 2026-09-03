"""
Coleta fotos de pessoas e organizações no Wikimedia Commons, com licença livre e
atribuição completa, conforme a seção 7 de EDITORIAL_POLICY.md.

Uso:
    python python/novelo_osint/fotos.py --listar          # só metadados (revisão editorial)
    python python/novelo_osint/fotos.py --baixar id1 id2  # baixa e grava o bloco `photo`

Nunca baixa arquivo de licença não livre: o resultado é registrado como "sem foto adequada"
e a interface mantém o avatar neutro.
"""

from __future__ import annotations

import argparse
import html
import unicodedata
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
OUT = ROOT / "public" / "fotos"
UA = "NoveloMasterBot/0.1 (https://novelo-master.fausel.adv.br; contato via GitHub) urllib"

# Licenças aceitas (livres). Qualquer outra coisa é recusada.
FREE = re.compile(
    r"^(cc0|cc[ -]by([ -]sa)?([ -][0-9.]+)?|public domain|pd[ -]|domínio público|"
    r"gfdl|attribution|creative commons)",
    re.I,
)
# Situações vedadas pela política editorial (checagem por texto do arquivo/descrição).
FORBIDDEN = re.compile(
    r"algem|pris(ão|ao)|preso|detid|custódia|custodia|viatura|delegacia|cadeia|"
    r"filh[oa]s?\b|família|familia|menor de idade|criança|crianca",
    re.I,
)


def api(host: str, params: dict) -> dict:
    url = f"https://{host}/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def strip_html(value: str) -> str:
    texto = html.unescape(re.sub(r"<[^>]+>", "", value or ""))
    return re.sub(r"\s+", " ", texto).strip()


def dedup(value: str) -> str:
    """O extmetadata às vezes repete o mesmo texto duas vezes ao remover as tags."""
    meio = len(value) // 2
    if len(value) > 6 and len(value) % 2 == 0 and value[:meio] == value[meio:]:
        return value[:meio]
    return value


def normalizar(value: str) -> str:
    sem_acento = "".join(
        c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"[^a-z ]", " ", sem_acento.lower())


def mesmo_nome(titulo_artigo: str, nome: str) -> bool:
    """O artigo precisa conter todas as palavras significativas do nome da pessoa.

    Sem isso a busca aproximada devolve homônimo ou até o brasão de um órgão —
    publicar a foto de outra pessoa num dossiê seria erro grave.
    """
    alvo = set(normalizar(titulo_artigo).split())
    partes = [p for p in normalizar(nome).split() if len(p) > 2 and p not in {"dos", "das", "de", "da", "do"}]
    return bool(partes) and all(p in alvo for p in partes)


def page_image(title: str, host: str = "pt.wikipedia.org") -> str | None:
    """Segue redirecionamento e, se preciso, cai para a busca do próprio título."""
    data = api(
        host,
        {"action": "query", "titles": title, "prop": "pageimages", "piprop": "name", "redirects": 1},
    )
    for page in (data.get("query", {}).get("pages") or {}).values():
        if page.get("pageimage"):
            return page["pageimage"]
    busca = api(host, {"action": "query", "list": "search", "srsearch": title, "srlimit": 3})
    hits = [h for h in (busca.get("query", {}).get("search") or []) if mesmo_nome(h["title"], title)]
    if not hits:
        return None
    data = api(
        host,
        {
            "action": "query",
            "titles": hits[0]["title"],
            "prop": "pageimages",
            "piprop": "name",
            "redirects": 1,
        },
    )
    for page in (data.get("query", {}).get("pages") or {}).values():
        if page.get("pageimage"):
            return page["pageimage"]
    return None


def commons_meta(filename: str, width: int = 400) -> dict | None:
    data = api(
        "commons.wikimedia.org",
        {
            "action": "query",
            "titles": f"File:{filename}",
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|mime",
            "iiurlwidth": width,
        },
    )
    for page in (data.get("query", {}).get("pages") or {}).values():
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            return None
        meta = info.get("extmetadata", {})
        get = lambda k: strip_html(meta.get(k, {}).get("value", ""))  # noqa: E731
        return {
            "file": filename,
            "thumb": info.get("thumburl") or info.get("url"),
            "mime": info.get("mime", ""),
            "descricao_url": info.get("descriptionurl", ""),
            "autor": (dedup(get("Artist")) or "Autor não identificado")[:120].rstrip(" ;,[("),
            "licenca": get("LicenseShortName") or get("License"),
            "descricao": get("ImageDescription"),
            "credito": get("Credit"),
        }
    return None


def entities(kind: str) -> list[dict]:
    out = []
    for path in sorted((DATA / kind).glob("*.yaml")):
        rec = yaml.safe_load(path.read_text(encoding="utf-8"))
        rec["_path"] = path
        out.append(rec)
    return out


def wiki_title(rec: dict) -> str:
    url = ((rec.get("external_ids") or {}).get("wikipedia_pt")) or ""
    if url:
        return urllib.parse.unquote(url.rsplit("/", 1)[-1])
    return rec.get("full_name") or rec["name"]


# Para organização só serve marca própria: a "imagem da página" costuma ser prédio,
# foto de sessão ou até infográfico de terceiro sobre o caso, que não pode entrar.
MARCA = re.compile(r"logo|logotipo|bras[aã]o|bandeira|emblema|s[ií]mbolo", re.I)


def marca_valida(meta: dict) -> bool:
    return bool(MARCA.search(meta["file"])) or "svg" in (meta.get("mime") or "")


def candidate(rec: dict, kind: str = "people") -> dict:
    result = {"id": rec["id"], "nome": rec["name"], "titulo": wiki_title(rec)}
    try:
        filename = page_image(result["titulo"])
    except Exception as exc:  # rede instável não deve derrubar o lote
        result["erro"] = f"wikipedia: {exc}"
        return result
    if not filename:
        result["status"] = "sem imagem na Wikipédia"
        return result
    try:
        meta = commons_meta(filename)
    except Exception as exc:
        result["erro"] = f"commons: {exc}"
        return result
    if not meta:
        result["status"] = "arquivo não está no Commons"
        return result
    result.update(meta)
    texto = f"{meta['file']} {meta['descricao']}"
    if not FREE.match(meta["licenca"] or ""):
        result["status"] = f"licença recusada: {meta['licenca']!r}"
    elif kind == "organizations" and not marca_valida(meta):
        result["status"] = "não é marca própria da organização"
    elif FORBIDDEN.search(texto):
        result["status"] = "recusada pela política editorial (situação vedada)"
    else:
        result["status"] = "ok"
    return result


def baixar(result: dict, alt: str) -> dict:
    OUT.mkdir(parents=True, exist_ok=True)
    ext = ".png" if "png" in result["mime"] or "svg" in result["mime"] else ".jpg"
    dest = OUT / f"{result['id']}{ext}"
    req = urllib.request.Request(result["thumb"], headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())
    return {
        "path": f"/fotos/{dest.name}",
        "source": "Wikimedia Commons",
        "author": result["autor"],
        "license": result["licenca"],
        "original_url": result["descricao_url"],
        "retrieved_at": TODAY,
        "alt": alt,
    }


TODAY = "2026-09-03"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--listar", action="store_true")
    parser.add_argument("--baixar", nargs="*", default=None)
    parser.add_argument("--kind", default="people,organizations")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    alvo = set(args.baixar or [])
    # Arquivo já usado por outra entidade: sinal de homônimo ou parente (ex.: pai e filho).
    usados = {
        (rec.get("photo") or {}).get("original_url"): rec["id"]
        for k in ("people", "organizations")
        for rec in entities(k)
        if rec.get("photo")
    }
    for kind in args.kind.split(","):
        for rec in entities(kind):
            if alvo and rec["id"] not in alvo:
                continue
            if rec.get("photo") and not alvo:
                continue
            result = candidate(rec, kind)
            print(
                f"{result['id']}\t{result.get('status') or result.get('erro')}\t"
                f"{result.get('licenca','')}\t{result.get('autor','')[:40]}\t{result.get('file','')}"
            )
            dono = usados.get(result.get("descricao_url"))
            if result.get("status") == "ok" and dono and dono != rec["id"]:
                result["status"] = f"arquivo já usado por {dono}"
                print(f"  ! recusado: mesmo arquivo de {dono}")
            if args.baixar is not None and result.get("status") == "ok":
                artigo = "a" if kind == "people" else "o"
                alt = (
                    f"Retrato de {rec['name']}"
                    if kind == "people"
                    else f"Marca d{artigo} {rec['name']}"
                )
                rec["photo"] = baixar(result, alt)
                usados[result["descricao_url"]] = rec["id"]
                rec["updated_at"] = TODAY
                path = rec.pop("_path")
                path.write_text(
                    yaml.safe_dump(rec, allow_unicode=True, sort_keys=False, width=100),
                    encoding="utf-8",
                    newline="\n",
                )


if __name__ == "__main__":
    main()
