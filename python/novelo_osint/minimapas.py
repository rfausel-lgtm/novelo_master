"""Gera os minimapas estáticos dos lugares do corpus.

Por que estático e servido pela própria origem, em vez de um mapa embutido: a CSP do site só admite
imagem da própria origem, e afrouxá-la para um provedor de tiles significaria que cada leitor de um
dossiê seria requisitado por um terceiro. Aqui os tiles do OpenStreetMap são baixados uma vez, no
momento de gerar, e viram um PNG no repositório. O leitor não fala com ninguém além do site.

A atribuição ao OpenStreetMap é obrigatória (ODbL) e é feita pelo componente que exibe o mapa.

Uso:
    python python/novelo_osint/minimapas.py
"""

from __future__ import annotations

import io
import math
import sys
import time
import urllib.request
from pathlib import Path

import yaml
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
OUT = ROOT / "public" / "mapas"
TILE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
UA = "NoveloMasterBot/0.1 (https://novelo-master.fausel.adv.br; contato via GitHub) minimapas"

# Zoom por precisão: não adianta mergulhar num ponto que é o município inteiro.
ZOOM = {"exact": 16, "approximate": 14, "city": 12}
LARGURA, ALTURA = 560, 280


def para_pixel(lat: float, lon: float, z: int) -> tuple[float, float]:
    n = 2**z
    x = (lon + 180.0) / 360.0 * n * 256
    rad = math.radians(lat)
    y = (1 - math.log(math.tan(rad) + 1 / math.cos(rad)) / math.pi) / 2 * n * 256
    return x, y


def baixar_tile(z: int, x: int, y: int) -> Image.Image:
    req = urllib.request.Request(TILE.format(z=z, x=x, y=y), headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")


def montar(lat: float, lon: float, z: int) -> Image.Image:
    """Compõe os tiles necessários e recorta a janela centrada no ponto."""
    cx, cy = para_pixel(lat, lon, z)
    esq, topo = cx - LARGURA / 2, cy - ALTURA / 2
    tx0, ty0 = int(esq // 256), int(topo // 256)
    tx1, ty1 = int((esq + LARGURA) // 256), int((topo + ALTURA) // 256)

    tela = Image.new("RGB", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            tela.paste(baixar_tile(z, tx, ty), ((tx - tx0) * 256, (ty - ty0) * 256))
            time.sleep(0.2)  # cortesia com o servidor de tiles do OSM

    dx, dy = esq - tx0 * 256, topo - ty0 * 256
    return tela.crop((int(dx), int(dy), int(dx) + LARGURA, int(dy) + ALTURA))


def lugares() -> list[tuple[str, dict]]:
    achados = []
    for pasta in ("events", "organizations"):
        for caminho in sorted((DATA / pasta).glob("*.yaml")):
            rec = yaml.safe_load(caminho.read_text(encoding="utf-8"))
            if rec.get("place") and rec.get("review_status") == "published":
                achados.append((rec["id"], rec["place"]))
    return achados


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    OUT.mkdir(parents=True, exist_ok=True)
    for ident, place in lugares():
        destino = OUT / f"{ident}.png"
        if destino.exists():
            print(f"= {ident} (já existe)")
            continue
        z = ZOOM.get(place["precision"], 14)
        imagem = montar(place["lat"], place["lon"], z)
        imagem.save(destino, "PNG", optimize=True)
        print(f"+ {ident} -> {destino.name} (zoom {z}, {destino.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
