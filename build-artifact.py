#!/usr/bin/env python3
"""Erzeugt eine Einzeldatei-Fassung der Seite mit eingebetteten Bildern.

Nützlich zum Verschicken, Hochladen oder Ansehen ohne Ordnerstruktur:

    python3 build-artifact.py            -> dist/riva-sei.html
"""

import base64
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "index.html"
OUT = ROOT / "dist" / "riva-sei.html"


def data_uri(rel_path: str) -> str:
    raw = (ROOT / rel_path).read_bytes()
    return "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii")


def main() -> None:
    html = SRC.read_text(encoding="utf-8")

    def replace(match: "re.Match[str]") -> str:
        return 'src="' + data_uri(match.group(1)) + '"'

    html = re.sub(r'src="(assets/[^"]+)"', replace, html)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)} — {OUT.stat().st_size / 1024:.0f} kB")


if __name__ == "__main__":
    main()
