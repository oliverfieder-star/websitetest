#!/usr/bin/env python3
"""Liest die RACI-Excel und erzeugt das Datenmodul der Planungs-App.

    python3 tools/extract_raci.py <RACI.xlsx>  -> data.js

Die Excel bleibt die Quelle der Wahrheit: Aufgabe, Zeitfenster (Max/Min)
und die RACI-Codes je Position werden 1:1 uebernommen. Klammercodes wie
"(R)" bedeuten "nur falls zutreffend" und werden als optional markiert.
"""
import json
import sys
import pathlib
import openpyxl

# Reihenfolge der Positionen wie im Abkuerzungsverzeichnis der Anleitung.
POSITIONS = ["VV", "CR", "F&R", "EM", "HR", "IM", "MK", "WB",
             "PL", "PT", "VerV", "MV", "Alumni"]


def main() -> None:
    src = pathlib.Path(sys.argv[1])
    out = pathlib.Path(__file__).resolve().parent.parent / "data.js"
    wb = openpyxl.load_workbook(src, data_only=True)
    areas = [s for s in wb.sheetnames if s != "Anleitung RACI"]

    tasks = []
    for ai, name in enumerate(areas):
        ws = wb[name]
        header = [ws.cell(1, c).value for c in range(1, 16)]
        for r in range(2, ws.max_row + 1):
            label = ws.cell(r, 1).value
            if not label or not str(label).strip():
                continue

            def cell(col):
                v = ws.cell(r, col).value
                if v is None:
                    return None
                s = str(v).strip()
                return s if s and s.lower() != "none" else None

            raci = {}
            for c in range(4, 16):
                raw = cell(c)
                if not raw:
                    continue
                pos = str(header[c - 1]).strip()
                # "(R)" = unterstuetzend / nur falls zutreffend
                optional = raw.startswith("(")
                code = raw.strip("()").upper()
                raci[str(POSITIONS.index(pos))] = code + ("?" if optional else "")

            tasks.append([ai, " ".join(str(label).split()),
                          cell(2), cell(3), raci])

    payload = {"areas": areas, "positions": POSITIONS, "tasks": tasks}
    out.write_text(
        "// Automatisch erzeugt aus der RACI-Excel: tools/extract_raci.py\n"
        "// Nicht von Hand aendern - Quelle ist die Excel.\n"
        "window.RACI_DATA = " + json.dumps(payload, ensure_ascii=False) + ";\n",
        encoding="utf-8")
    print(f"{out.name}: {len(tasks)} Aufgaben, {len(areas)} Bereiche, "
          f"{out.stat().st_size / 1024:.0f} kB")


if __name__ == "__main__":
    main()
