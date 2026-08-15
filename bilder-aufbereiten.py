#!/usr/bin/env python3
"""Bereitet die beiden Schreibtisch-Fotos für die Website auf.

Erwartet in assets/:

    schreibtisch-vorher.jpg     Schreibtisch abends, Zettel verstreut, Monitor dunkel
    schreibtisch-nachher.jpg    dieselbe Szene, Zettel gestapelt, Monitor an

Das Skript

  * skaliert beide auf höchstens 2000 px Breite,
  * schreibt eine .webp-Fassung daneben (die <source>-Zeile in index.html
    zeigt darauf),
  * drückt die .jpg-Fassung unter 300 kB,
  * meldet die tatsächlichen Bildmaße, damit width/height in index.html
    dazu passen.

Aufruf:  python3 bilder-aufbereiten.py
Braucht: Pillow  (pip install Pillow)
"""

import pathlib
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow fehlt.  Installieren mit:  pip install Pillow")

WURZEL = pathlib.Path(__file__).parent
ASSETS = WURZEL / "assets"
BILDER = ["schreibtisch-vorher", "schreibtisch-nachher"]

MAX_BREITE = 2000
MAX_BYTES = 300 * 1024


def jpg_schreiben(bild: Image.Image, ziel: pathlib.Path) -> None:
    """Speichert als JPG und senkt die Qualität, bis die Datei klein genug ist."""
    for qualitaet in range(88, 54, -4):
        bild.save(ziel, "JPEG", quality=qualitaet, optimize=True, progressive=True)
        if ziel.stat().st_size <= MAX_BYTES:
            return
    print(f"  ! {ziel.name} bleibt über 300 kB — Motiv ggf. kleiner ausgeben")


def main() -> None:
    fehlend = [n for n in BILDER if not (ASSETS / f"{n}.jpg").exists()]
    if fehlend:
        sys.exit(
            "Fehlende Vorlagen in assets/: "
            + ", ".join(f"{n}.jpg" for n in fehlend)
        )

    for name in BILDER:
        quelle = ASSETS / f"{name}.jpg"
        with Image.open(quelle) as bild:
            bild = bild.convert("RGB")

            if bild.width > MAX_BREITE:
                hoehe = round(bild.height * MAX_BREITE / bild.width)
                bild = bild.resize((MAX_BREITE, hoehe), Image.LANCZOS)

            webp = ASSETS / f"{name}.webp"
            bild.save(webp, "WEBP", quality=82, method=6)
            jpg_schreiben(bild, quelle)

            print(
                f"{name}: {bild.width}×{bild.height} px  ·  "
                f"jpg {quelle.stat().st_size / 1024:.0f} kB  ·  "
                f"webp {webp.stat().st_size / 1024:.0f} kB"
            )

    print("\nwidth/height in index.html gegen die Maße oben prüfen.")


if __name__ == "__main__":
    main()
