"""
Captura de páginas para OSINT: baixa a URL (com User-Agent de navegador),
guarda o HTML bruto em processed/captures/<sha1>.html e imprime texto limpo.

Uso:
  python python/novelo_osint/fetch.py <url> [--max-chars N] [--grep TERMO]

Nunca inclui cookies nem credenciais. Só registra o que foi efetivamente aberto.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAPTURES = ROOT / "processed" / "captures"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0 Safari/537.36"
)


def fetch(url: str, timeout: int = 40) -> tuple[int, bytes, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
        return resp.status, resp.read(), resp.headers.get("Content-Type", "")


def html_to_text(raw: str) -> tuple[str, str]:
    title_m = re.search(r"<title[^>]*>(.*?)</title>", raw, flags=re.S | re.I)
    title = html.unescape(re.sub(r"\s+", " ", title_m.group(1))).strip() if title_m else ""
    s = re.sub(r"<(script|style|noscript|svg|nav|header|footer)[^>]*>.*?</\1>", " ", raw, flags=re.S | re.I)
    s = re.sub(r"<br\s*/?>|</p>|</div>|</li>|</h[1-6]>|</tr>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t\r\f\v]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n\n", s)
    return title, s.strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--max-chars", type=int, default=12000)
    ap.add_argument("--grep", help="mostra apenas parágrafos contendo o termo (case-insensitive)")
    args = ap.parse_args()

    status, body, ctype = fetch(args.url)
    CAPTURES.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha1(args.url.encode()).hexdigest()[:16]
    retrieved_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    if "pdf" in ctype.lower() or body[:5] == b"%PDF-":
        pdf_path = CAPTURES / f"{digest}.pdf"
        pdf_path.write_bytes(body)
        try:
            from pypdf import PdfReader  # type: ignore

            reader = PdfReader(str(pdf_path))
            text = "\n\n".join((p.extract_text() or "") for p in reader.pages)
            title = (reader.metadata or {}).get("/Title", "") or ""
        except Exception as exc:  # noqa: BLE001
            print(f"[pdf salvo em {pdf_path}; extração falhou: {exc}]")
            return 0
    else:
        raw = body.decode("utf-8", errors="ignore")
        (CAPTURES / f"{digest}.html").write_text(raw, encoding="utf-8")
        title, text = html_to_text(raw)

    meta = {"url": args.url, "status": status, "content_type": ctype, "title": title, "retrieved_at": retrieved_at, "sha1": digest}
    (CAPTURES / f"{digest}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(meta, ensure_ascii=False))
    print("-" * 80)
    if args.grep:
        term = args.grep.lower()
        paras = [p for p in text.split("\n") if term in p.lower()]
        text = "\n".join(paras)
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    print(text[: args.max_chars])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
