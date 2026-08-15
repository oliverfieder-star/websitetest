#!/usr/bin/env python3
"""Baut die Seite zu einer einzigen HTML-Datei zusammen.

CSS und JavaScript wandern inline, die beiden Fotos als data:-URI ins
Markup. Heraus kommt eine Datei, die sich verschicken, hochladen oder per
Doppelklick öffnen lässt — ohne Ordner drumherum.

    python3 einzeldatei.py            ->  dist/mainfranken-digital.html

Fehlt ein Foto in assets/, setzt das Skript an seine Stelle einen sichtbar
als solchen markierten Platzhalter und sagt es beim Bauen an. Sobald die
echten Dateien da sind, einfach noch einmal laufen lassen.

Die Verweise auf impressum.html und datenschutz.html bleiben relativ — die
beiden Seiten stecken naturgemäß nicht mit in der Einzeldatei.
"""

import base64
import pathlib
import re
import sys

WURZEL = pathlib.Path(__file__).parent
QUELLE = WURZEL / "index.html"
ZIEL = WURZEL / "dist" / "mainfranken-digital.html"

BILDER = {
    "schreibtisch-vorher": "Schreibtisch abends, Arbeitsberichte verstreut, Monitor dunkel",
    "schreibtisch-nachher": "dieselbe Szene, Berichte gestapelt, Monitor an",
}


def data_uri(pfad: pathlib.Path) -> str:
    typ = "image/webp" if pfad.suffix == ".webp" else "image/jpeg"
    roh = pfad.read_bytes()
    return f"data:{typ};base64," + base64.b64encode(roh).decode("ascii")


def platzhalter(name: str, beschreibung: str) -> str:
    """Blaupausen-Kachel mit dem fehlenden Dateinamen — kein Foto-Ersatz."""
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1120">'
        '<rect width="2000" height="1120" fill="#08192B"/>'
        '<g stroke="#EDF2F7" stroke-opacity=".07">'
        + "".join(f'<path d="M{x} 0V1120"/>' for x in range(0, 2001, 80))
        + "".join(f'<path d="M0 {y}H2000"/>' for y in range(0, 1121, 80))
        + "</g>"
        '<g stroke="#C8763C" stroke-width="4" fill="none">'
        '<path d="M60 140V60h80"/><path d="M1860 60h80v80"/>'
        '<path d="M1940 980v80h-80"/><path d="M140 1060H60v-80"/>'
        "</g>"
        '<text x="1000" y="530" fill="#C8763C" text-anchor="middle" '
        'font-family="monospace" font-size="44" letter-spacing="6">[PLATZHALTER]</text>'
        f'<text x="1000" y="612" fill="#EDF2F7" text-anchor="middle" '
        f'font-family="monospace" font-size="40">assets/{name}.jpg</text>'
        f'<text x="1000" y="678" fill="#7C8A99" text-anchor="middle" '
        f'font-family="sans-serif" font-size="32">{beschreibung}</text>'
        "</svg>"
    )
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode("utf-8")).decode("ascii")


def foto_uri(name: str, beschreibung: str) -> tuple[str, bool]:
    """Bevorzugt WebP, sonst JPG, sonst Platzhalter."""
    for endung in (".webp", ".jpg"):
        pfad = WURZEL / "assets" / f"{name}{endung}"
        if pfad.exists():
            return data_uri(pfad), True
    return platzhalter(name, beschreibung), False


def main() -> None:
    if not QUELLE.exists():
        sys.exit("index.html nicht gefunden.")

    html = QUELLE.read_text(encoding="utf-8")

    # CSS inline
    css = (WURZEL / "style.css").read_text(encoding="utf-8")
    html = html.replace(
        '<link rel="stylesheet" href="style.css">',
        "<style>\n" + css + "\n</style>",
    )

    # JavaScript inline. </script> im Code würde die Datei zerreißen.
    js = (WURZEL / "main.js").read_text(encoding="utf-8")
    js = js.replace("</script", "<\\/script")
    html = html.replace(
        '<script src="main.js"></script>',
        "<script>\n" + js + "\n</script>",
    )

    # Fotos einbetten und die WebP-Alternativen entfernen — in einer
    # Einzeldatei gibt es nichts mehr auszuwählen.
    fehlend = []
    for name, beschreibung in BILDER.items():
        uri, echt = foto_uri(name, beschreibung)
        if not echt:
            fehlend.append(name)
        html = re.sub(
            r'\s*<source type="image/webp" srcset="assets/%s\.webp">' % re.escape(name),
            "",
            html,
        )
        html = html.replace(f'src="assets/{name}.jpg"', f'src="{uri}"')

    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    ZIEL.write_text(html, encoding="utf-8")

    groesse = ZIEL.stat().st_size / 1024
    print(f"{ZIEL.relative_to(WURZEL)} — {groesse:.0f} kB")

    if fehlend:
        print()
        print("Mit Platzhaltern gebaut, diese Fotos fehlen in assets/:")
        for name in fehlend:
            print(f"  {name}.jpg")
        print("Dateien hinlegen und das Skript noch einmal laufen lassen.")


if __name__ == "__main__":
    main()
