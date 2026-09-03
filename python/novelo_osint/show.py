"""Imprime o texto limpo de uma captura local (processed/captures) pela URL, sem refetch."""
import json, sys, glob
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from fetch import html_to_text, CAPTURES
url = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 3500
for j in glob.glob(str(CAPTURES / "*.json")):
    m = json.load(open(j, encoding="utf-8"))
    if m.get("url") == url:
        h = Path(j).with_suffix(".html")
        if not h.exists():
            print("[sem html]"); break
        title, text = html_to_text(h.read_text(encoding="utf-8", errors="ignore"))
        sys.stdout.reconfigure(encoding="utf-8")
        print("\n".join(l for l in text.split("\n") if l.strip())[:n]); break
else:
    print("[não encontrado]")
