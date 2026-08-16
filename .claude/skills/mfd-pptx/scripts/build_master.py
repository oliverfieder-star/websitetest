# -*- coding: utf-8 -*-
"""
Baut den Mainfranken-Digital-Folienmaster: acht Layout-Folien mit
[PLATZHALTER]-Inhalten als Kopiervorlage. Jede Folie zeigt einen
Layout-Typ der Werkfilm-Designsprache.

    python3 build_master.py [ziel.pptx]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from mfd import *  # noqa: F401,F403

HIER = Path(__file__).parent.parent
ASSETS = HIER / "assets"
DECKNAME = "Folienmaster"


def hauptbereich_y():
    return Inches(2.55)


def baue(ziel):
    prs = neues_deck()

    # ── 1 · Cover: Bild, Schleier, Marke, Headline ──────────────────
    s = folie(prs)
    bild(s, str(ASSETS / "k4-buero-nacht.jpg"), 0, 0, BREITE, HOEHE, abdunkeln=62)
    textblock(s, RAND, Inches(0.55), Inches(8), Inches(0.4),
              [[("MAINFRANKEN ", DISPLAY, 15, SILBER, True, 150),
                ("DIGITAL", DISPLAY, 15, STAHL, True, 150)]])
    kicker(s, "[ANLASS, Z. B. ANGEBOT]", y=Inches(2.5))
    headline(s, [("[Titel der ", SILBER), ("Sache", STAHL), (".]", SILBER)],
             y=Inches(2.95), groesse=44)
    fliesstext(s, "[Unterzeile: ein Satz, worum es geht. Kein Schmuck, keine Floskeln.]",
               RAND, Inches(4.35), Inches(8.4), groesse=14, blocksatz=False)
    textblock(s, RAND, HOEHE - Inches(0.95), Inches(10), Inches(0.4),
              [[("[DATUM]  ·  [EMPFÄNGER ODER KONTEXT]", MONO, 10, GEDIMMT, False, 200)]])

    # ── 2 · Aussage: Trenner, Headline, Blocksatz-Text ───────────────
    s = folie(prs)
    massketten_trenner(s, "[Sektion]", Inches(0.75))
    headline(s, [("Klare ", SILBER), ("Aussage", STAHL), (".", SILBER)], y=Inches(1.55))
    fliesstext(s, ["[Erster Absatz im Blocksatz. Die Website spricht ruhig und konkret; "
                   "Folien tun das auch. Ein Gedanke pro Folie.]",
                   "[Zweiter Absatz, falls nötig. Lieber kürzen als quetschen.]"],
               RAND, hauptbereich_y(), Inches(7.6), Inches(3.2), groesse=14)
    fusszeile(s, DECKNAME, 2)

    # ── 3 · Zwei Karten (z. B. Angebot in zwei Schritten) ────────────
    s = folie(prs)
    massketten_trenner(s, "Angebot", Inches(0.75))
    headline(s, [("Zwei ", SILBER), ("Karten", STAHL), (".", SILBER)], y=Inches(1.55))
    kw = (BREITE - 2 * RAND - Inches(0.5)) / 2
    for i, (schritt, titel, preis) in enumerate([
            ("Schritt 1", "[Karte links]", "[Preis oder Kern]"),
            ("Schritt 2", "[Karte rechts]", "[Preis oder Kern]")]):
        x = RAND + i * (kw + Inches(0.5))
        karte(s, x, hauptbereich_y(), kw, Inches(3.6), betont=(i == 0))
        pille(s, schritt, x + Inches(0.4), hauptbereich_y() + Inches(0.4))
        textblock(s, x + Inches(0.4), hauptbereich_y() + Inches(1.0), kw - Inches(0.8), Inches(0.5),
                  [[(titel, DISPLAY, 19, SILBER, True)]])
        fliesstext(s, "[Drei bis vier Zeilen, was drinsteckt und was am Ende da ist.]",
                   x + Inches(0.4), hauptbereich_y() + Inches(1.6), kw - Inches(0.8),
                   Inches(1.2), groesse=12)
        textblock(s, x + Inches(0.4), hauptbereich_y() + Inches(2.85), kw - Inches(0.8), Inches(0.5),
                  [[(preis, DISPLAY, 17, STAHL, True)]])
    fusszeile(s, DECKNAME, 3)

    # ── 4 · Kennzahlen ───────────────────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Förderung", Inches(0.75))
    headline(s, [("Drei ", SILBER), ("Kennzahlen", STAHL), (".", SILBER)], y=Inches(1.55))
    zb = (BREITE - 2 * RAND) / 3
    for i, (wert, label) in enumerate([("50 %", "[Label eins]"),
                                       ("7.500 €", "[Label zwei]"),
                                       ("[Wert]", "[Label drei]")]):
        zahl(s, wert, label, RAND + i * zb, Inches(3.0))
    linie_h(s, RAND, Inches(4.75), BREITE - 2 * RAND)
    fliesstext(s, "[Einordnender Satz unter den Zahlen, z. B. Quelle oder Bedingung.]",
               RAND, Inches(4.95), Inches(9), groesse=11, blocksatz=False)
    fusszeile(s, DECKNAME, 4)

    # ── 5 · Ablauf in vier Schritten ─────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Ablauf", Inches(0.75))
    headline(s, [("Vier ", SILBER), ("Schritte", STAHL), (".", SILBER)], y=Inches(1.55))
    sw = (BREITE - 2 * RAND - 3 * Inches(0.4)) / 4
    for i, (titel, text) in enumerate([
            ("[Schritt eins]", "[Was passiert, in zwei Zeilen.]"),
            ("[Schritt zwei]", "[Was passiert, in zwei Zeilen.]"),
            ("[Schritt drei]", "[Was passiert, in zwei Zeilen.]"),
            ("[Schritt vier]", "[Was passiert, in zwei Zeilen.]")]):
        x = RAND + i * (sw + Inches(0.4))
        karte(s, x, hauptbereich_y(), sw, Inches(3.3))
        textblock(s, x + Inches(0.3), hauptbereich_y() + Inches(0.3), sw - Inches(0.6), Inches(0.7),
                  [[(f"0{i+1}", MONO, 26, STAHL, True)]])
        textblock(s, x + Inches(0.3), hauptbereich_y() + Inches(1.15), sw - Inches(0.6), Inches(0.6),
                  [[(titel, DISPLAY, 14, SILBER, True)]])
        fliesstext(s, text, x + Inches(0.3), hauptbereich_y() + Inches(1.7),
                   sw - Inches(0.6), Inches(1.4), groesse=11, blocksatz=False)
    fusszeile(s, DECKNAME, 5)

    # ── 6 · Positionen (Preiszeilen) ─────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Positionen", Inches(0.75))
    headline(s, [("Leistung und ", SILBER), ("Preis", STAHL), (".", SILBER)], y=Inches(1.55))
    y = hauptbereich_y()
    for pos, beschr, preis in [("01", "[Position eins]", "[0.000 €]"),
                               ("02", "[Position zwei]", "[0.000 €]"),
                               ("03", "[Position drei]", "[inklusive]")]:
        linie_h(s, RAND, y, BREITE - 2 * RAND)
        textblock(s, RAND, y + Inches(0.18), Inches(0.8), Inches(0.4),
                  [[(pos, MONO, 12, STAHL, False, 200)]])
        textblock(s, RAND + Inches(0.9), y + Inches(0.15), Inches(7.6), Inches(0.5),
                  [[(beschr, TEXT, 14, SILBER)]])
        textblock(s, BREITE - RAND - Inches(2.6), y + Inches(0.15), Inches(2.6), Inches(0.5),
                  [[(preis, DISPLAY, 14, SILBER, True), {"align": PP_ALIGN.RIGHT}]])
        y += Inches(0.62)
    linie_h(s, RAND, y, BREITE - 2 * RAND, farbe=STAHL, staerke=1.2)
    textblock(s, RAND + Inches(0.9), y + Inches(0.15), Inches(6), Inches(0.5),
              [[("Summe netto", DISPLAY, 15, SILBER, True)]])
    textblock(s, BREITE - RAND - Inches(2.6), y + Inches(0.15), Inches(2.6), Inches(0.5),
              [[("[0.000 €]", DISPLAY, 16, STAHL, True), {"align": PP_ALIGN.RIGHT}]])
    fliesstext(s, "[Hinweiszeile: zzgl. USt, Nebenkosten, Gültigkeit.]",
               RAND, y + Inches(0.85), Inches(9), groesse=11, blocksatz=False)
    fusszeile(s, DECKNAME, 6)

    # ── 7 · Kontakt / CTA ────────────────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Kontakt", Inches(0.75))
    headline(s, [("Der nächste Schritt ist ein ", SILBER), ("Gespräch", STAHL), (".", SILBER)],
             y=Inches(1.55), groesse=32)
    karte(s, RAND, Inches(2.75), BREITE - 2 * RAND, Inches(2.6), betont=True)
    portraet_rund(s, str(ASSETS / "oliver-portraet.jpg"), RAND + Inches(0.5), Inches(3.2), Inches(1.6))
    textblock(s, RAND + Inches(2.5), Inches(3.25), Inches(5.4), Inches(2),
              [[("Oliver Fieder", DISPLAY, 17, SILBER, True)],
               [("Gründer und Berater, Mainfranken Digital", TEXT, 11, GEDIMMT),
                {"abstand_vor": Pt(2)}],
               [("Selbstständig seit dem 15. Lebensjahr, über sechs Jahre Unternehmer, "
                 "seit rund drei Jahren in der Beratung, in Projekten unter anderem mit "
                 "Kunden wie Siemens.", TEXT, 11, NEBEL),
                {"abstand_vor": Pt(8), "zeilenabstand": 1.25}]])
    textblock(s, BREITE - RAND - Inches(3.5), Inches(3.25), Inches(3.1), Inches(1.4),
              [[("0179 213 74 76", DISPLAY, 14, SILBER, True)],
               [("oliver@mainfranken-digital.de", TEXT, 11, NEBEL), {"abstand_vor": Pt(4)}],
               [("Versbacher Straße 20 · 97078 Würzburg", TEXT, 11, NEBEL), {"abstand_vor": Pt(4)}]])
    cta(s, "Gespräch vereinbaren", BREITE - RAND - Inches(3.5), Inches(4.55),
        link="https://calendly.com/oliver2004-fieder/30min")
    fusszeile(s, DECKNAME, 7)

    # ── 8 · Konditionen + Unterschrift ───────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Konditionen", Inches(0.75))
    headline(s, [("Konditionen und ", SILBER), ("Annahme", STAHL), (".", SILBER)],
             y=Inches(1.45), groesse=28)
    fliesstext(s, ["[Gültigkeit: An dieses Angebot halten wir uns bis zum TT.MM.JJJJ gebunden.]",
                   "[Zahlung: 14 Tage nach Rechnungsstellung ohne Abzug.]",
                   "[Weitere Bedingungen.]"],
               RAND, Inches(2.35), Inches(6.2), Inches(2.6), groesse=11)
    fliesstext(s, "Fieder Handels GmbH · Versbacher Straße 20 · 97078 Würzburg · "
                  "Amtsgericht Würzburg, HRB 17397 · Geschäftsführer: Oliver Fieder · "
                  "USt-ID DE3370133371. „Mainfranken Digital“ ist ein Angebot der "
                  "Fieder Handels GmbH.",
               RAND, Inches(5.0), Inches(6.2), Inches(1.2), groesse=9, blocksatz=False)
    ux = BREITE - RAND - Inches(4.4)
    for i, wer in enumerate(["[Ort, Datum · Auftraggeber]", "Würzburg, [DATUM] · Fieder Handels GmbH"]):
        y = Inches(3.1) + i * Inches(1.5)
        linie_h(s, ux, y + Inches(0.7), Inches(4.4), farbe=NEBEL)
        textblock(s, ux, y + Inches(0.8), Inches(4.4), Inches(0.4),
                  [[(wer, TEXT, 10, GEDIMMT)]])
    fusszeile(s, DECKNAME, 8)

    prs.save(ziel)
    print(f"gespeichert: {ziel}")


if __name__ == "__main__":
    baue(sys.argv[1] if len(sys.argv) > 1 else str(HIER / "assets" / "mfd_master.pptx"))
