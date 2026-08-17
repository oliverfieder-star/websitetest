# -*- coding: utf-8 -*-
"""
Baut den Mainfranken-Digital-Folienmaster: 16 Layout-Folien mit
[PLATZHALTER]-Inhalten als Kopiervorlage für Beratungs-Decks.

Rhythmus: Inhalte laufen im hellen Modus (Papier-Grund, gut lesbar im
Besprechungsraum), Cover, Abschnittstrenner, Zitat und Kontakt setzen
dunkle Werkfilm-Akzente. So bleibt der Website-Look erkennbar, ohne
dass das Deck schwer wird.

    python3 build_master.py [ziel.pptx]
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from mfd import *  # noqa: F401,F403

HIER = Path(__file__).parent.parent
ASSETS = HIER / "assets"
DECKNAME = "Folienmaster"
INHALT_Y = Inches(2.45)


def kopfzeile(s, sektion, titel_teile, groesse=30):
    """Standard-Kopf einer Inhaltsfolie: Trenner + Headline."""
    massketten_trenner(s, sektion, Inches(0.7))
    headline(s, titel_teile, y=Inches(1.4), groesse=groesse)


def baue(ziel):
    prs = neues_deck()
    seite = 0

    def fuss(s, _z=[0]):
        nonlocal seite
        seite += 1
        fusszeile(s, DECKNAME, seite)

    # ── 1 · Cover (dunkel, Bild) ─────────────────────────────────────
    setze_modus("dunkel")
    s = folie(prs)
    bild(s, str(ASSETS / "k4-buero-nacht.jpg"), 0, 0, BREITE, HOEHE, abdunkeln=68)
    textblock(s, RAND, Inches(0.55), Inches(8), Inches(0.4),
              [[("MAINFRANKEN ", DISPLAY, 15, SILBER, True, 150),
                ("DIGITAL", DISPLAY, 15, STAHL, True, 150)]])
    kicker(s, "[Anlass, z. B. Ergebnisvorstellung]", y=Inches(2.5), farbe=STAHL)
    headline(s, [("[Titel der ", SILBER), ("Sache", STAHL), (".]", SILBER)],
             y=Inches(2.95), groesse=44)
    fliesstext(s, "[Unterzeile: ein Satz, worum es geht.]",
               RAND, Inches(4.35), Inches(8.4), groesse=14, blocksatz=False, farbe=NEBEL)
    textblock(s, RAND, HOEHE - Inches(0.95), Inches(10), Inches(0.4),
              [[("[DATUM]  ·  [BETRIEB / EMPFÄNGER]", MONO, 10, GEDIMMT, False, 200)]])
    seite += 1

    # ── 2 · Agenda (hell) ────────────────────────────────────────────
    setze_modus("hell")
    s = folie(prs)
    kopfzeile(s, "Agenda", [("Worüber wir heute ", GRAPHIT), ("sprechen", STAHL_TIEF), (".", GRAPHIT)])
    y = INHALT_Y + Inches(0.15)
    for i, punkt in enumerate(["[Erster Punkt]", "[Zweiter Punkt]", "[Dritter Punkt]",
                               "[Vierter Punkt]", "[Fünfter Punkt]"]):
        linie_h(s, RAND, y, BREITE - 2 * RAND)
        textblock(s, RAND, y + Inches(0.14), Inches(0.9), Inches(0.5),
                  [[(f"0{i+1}", MONO, 15, STAHL_TIEF, True)]])
        textblock(s, RAND + Inches(1.0), y + Inches(0.12), Inches(9), Inches(0.5),
                  [[(punkt, DISPLAY, 16, GRAPHIT, True)]])
        y += Inches(0.72)
    linie_h(s, RAND, y, BREITE - 2 * RAND)
    fuss(s)

    # ── 3 · Abschnittstrenner (dunkel, große Nummer) ─────────────────
    setze_modus("dunkel")
    s = folie(prs)
    textblock(s, RAND, Inches(2.15), Inches(4), Inches(1.6),
              [[("01", MONO, 80, STAHL, True)]])
    massketten_trenner(s, "[Abschnitt]", Inches(4.0))
    headline(s, [("[Titel des ", SILBER), ("Abschnitts", STAHL), (".]", SILBER)],
             y=Inches(4.45), groesse=34)
    fuss(s)

    # ── 4 · Aussage (hell) ───────────────────────────────────────────
    setze_modus("hell")
    s = folie(prs)
    kopfzeile(s, "[Sektion]", [("Eine klare ", GRAPHIT), ("Aussage", STAHL_TIEF), (".", GRAPHIT)])
    fliesstext(s, ["[Erster Absatz im Blocksatz. Ein Gedanke pro Folie; die "
                   "Headline trägt die Botschaft, der Text belegt sie.]",
                   "[Zweiter Absatz, falls nötig. Lieber kürzen als quetschen.]"],
               RAND, INHALT_Y + Inches(0.1), Inches(9.4), Inches(3.2), groesse=14)
    fuss(s)

    # ── 5 · Text + Bullets (hell) ────────────────────────────────────
    s = folie(prs)
    kopfzeile(s, "[Sektion]", [("Text und ", GRAPHIT), ("Aufzählung", STAHL_TIEF), (".", GRAPHIT)])
    fliesstext(s, "[Einleitender Absatz: worum geht es, warum ist es relevant.]",
               RAND, INHALT_Y + Inches(0.1), Inches(5.4), Inches(3.4), groesse=13)
    bullets(s, [("[Titel eins]", "[Beleg oder Detail in einem Satz.]"),
                ("[Titel zwei]", "[Beleg oder Detail in einem Satz.]"),
                ("[Titel drei]", "[Beleg oder Detail in einem Satz.]"),
                ("[Titel vier]", "[Beleg oder Detail in einem Satz.]")],
            RAND + Inches(6.0), INHALT_Y + Inches(0.1), Inches(5.7), groesse=13)
    fuss(s)

    # ── 6 · Vergleich zwei Spalten (hell) ────────────────────────────
    s = folie(prs)
    kopfzeile(s, "Vergleich", [("Heute gegen ", GRAPHIT), ("morgen", STAHL_TIEF), (".", GRAPHIT)])
    kw = (BREITE - 2 * RAND - Inches(0.5)) / 2
    for i, (label, punkte) in enumerate([
            ("[Heute]", ["[Ist-Zustand eins]", "[Ist-Zustand zwei]", "[Ist-Zustand drei]"]),
            ("[Morgen]", ["[Ziel-Zustand eins]", "[Ziel-Zustand zwei]", "[Ziel-Zustand drei]"])]):
        x = RAND + i * (kw + Inches(0.5))
        karte(s, x, INHALT_Y, kw, Inches(3.7), betont=(i == 1))
        pille(s, label, x + Inches(0.4), INHALT_Y + Inches(0.35))
        bullets(s, punkte, x + Inches(0.4), INHALT_Y + Inches(1.05), kw - Inches(0.8), groesse=12.5)
    fuss(s)

    # ── 7 · Drei Karten (hell) ───────────────────────────────────────
    s = folie(prs)
    kopfzeile(s, "[Sektion]", [("Drei ", GRAPHIT), ("Karten", STAHL_TIEF), (".", GRAPHIT)])
    kw = (BREITE - 2 * RAND - 2 * Inches(0.4)) / 3
    for i in range(3):
        x = RAND + i * (kw + Inches(0.4))
        karte(s, x, INHALT_Y, kw, Inches(3.4))
        textblock(s, x + Inches(0.35), INHALT_Y + Inches(0.35), kw - Inches(0.7), Inches(0.6),
                  [[(f"[Karte {i+1}]", DISPLAY, 15, GRAPHIT, True)]])
        fliesstext(s, "[Drei bis vier Zeilen Inhalt. Karten tragen gleichrangige "
                      "Punkte; für Rangfolge Nummern ergänzen.]",
                   x + Inches(0.35), INHALT_Y + Inches(0.95), kw - Inches(0.7),
                   Inches(2.1), groesse=11.5, blocksatz=False)
    fuss(s)

    # ── 8 · Vier Schritte (hell) ─────────────────────────────────────
    s = folie(prs)
    kopfzeile(s, "Ablauf", [("Vier ", GRAPHIT), ("Schritte", STAHL_TIEF), (".", GRAPHIT)])
    sw = (BREITE - 2 * RAND - 3 * Inches(0.4)) / 4
    for i in range(4):
        x = RAND + i * (sw + Inches(0.4))
        karte(s, x, INHALT_Y, sw, Inches(3.3))
        textblock(s, x + Inches(0.3), INHALT_Y + Inches(0.3), sw - Inches(0.6), Inches(0.7),
                  [[(f"0{i+1}", MONO, 26, STAHL_TIEF, True)]])
        textblock(s, x + Inches(0.3), INHALT_Y + Inches(1.15), sw - Inches(0.6), Inches(0.6),
                  [[(f"[Schritt {i+1}]", DISPLAY, 14, GRAPHIT, True)]])
        fliesstext(s, "[Was passiert, in zwei Zeilen.]",
                   x + Inches(0.3), INHALT_Y + Inches(1.7), sw - Inches(0.6),
                   Inches(1.4), groesse=11, blocksatz=False)
    fuss(s)

    # ── 9 · Zeitplan (hell) ──────────────────────────────────────────
    s = folie(prs)
    kopfzeile(s, "Zeitplan", [("So sieht der ", GRAPHIT), ("Fahrplan", STAHL_TIEF), (" aus.", GRAPHIT)])
    zeitstrahl(s, [("[KW 1]", "[Phase eins]", "[Was passiert.]"),
                   ("[KW 2-3]", "[Phase zwei]", "[Was passiert.]"),
                   ("[KW 4-6]", "[Phase drei]", "[Was passiert.]"),
                   ("[ab KW 7]", "[Phase vier]", "[Was passiert.]")],
               y=Inches(3.6))
    fuss(s)

    # ── 10 · Kennzahlen (hell) ───────────────────────────────────────
    s = folie(prs)
    kopfzeile(s, "Zahlen", [("Drei ", GRAPHIT), ("Kennzahlen", STAHL_TIEF), (".", GRAPHIT)])
    zb = (BREITE - 2 * RAND) / 3
    for i, (wert, label) in enumerate([("[50 %]", "[Label eins]"),
                                       ("[7.500 €]", "[Label zwei]"),
                                       ("[Wert]", "[Label drei]")]):
        zahl(s, wert, label, RAND + i * zb, Inches(3.1))
    linie_h(s, RAND, Inches(4.9), BREITE - 2 * RAND)
    fliesstext(s, "[Einordnender Satz: Quelle, Zeitraum oder Bedingung.]",
               RAND, Inches(5.1), Inches(9), groesse=11, blocksatz=False)
    fuss(s)

    # ── 11 · Diagramm (hell, in PowerPoint editierbar) ───────────────
    s = folie(prs)
    kopfzeile(s, "Auswertung", [("Ein Bild sagt mehr als eine ", GRAPHIT),
                                ("Tabelle", STAHL_TIEF), (".", GRAPHIT)])
    balkendiagramm(s, ["[Kat 1]", "[Kat 2]", "[Kat 3]", "[Kat 4]"],
                   [("[Reihe A]", (4, 7, 5, 9)), ("[Reihe B]", (3, 4, 6, 5))],
                   RAND, INHALT_Y, Inches(8.2), Inches(3.9))
    fliesstext(s, "[Kernaussage des Diagramms in zwei, drei Zeilen. Das "
                  "Diagramm ist nativ und lässt sich in PowerPoint samt "
                  "Daten bearbeiten.]",
               RAND + Inches(8.7), INHALT_Y + Inches(0.4), Inches(2.95),
               Inches(3.0), groesse=11.5, blocksatz=False)
    fuss(s)

    # ── 12 · Tabelle (hell) ──────────────────────────────────────────
    s = folie(prs)
    kopfzeile(s, "Übersicht", [("Sauber ", GRAPHIT), ("aufgereiht", STAHL_TIEF), (".", GRAPHIT)])
    tabelle(s, ["[Spalte 1]", "[Spalte 2]", "[Spalte 3]", "[Spalte 4]"],
            [["[Zeile 1]", "[Wert]", "[Wert]", "[Wert]"],
             ["[Zeile 2]", "[Wert]", "[Wert]", "[Wert]"],
             ["[Zeile 3]", "[Wert]", "[Wert]", "[Wert]"],
             ["[Zeile 4]", "[Wert]", "[Wert]", "[Wert]"]],
            RAND, INHALT_Y + Inches(0.1), BREITE - 2 * RAND)
    fuss(s)

    # ── 13 · Zitat / Kernbotschaft (dunkel) ──────────────────────────
    setze_modus("dunkel")
    s = folie(prs)
    zitat(s, "[Die eine Kernbotschaft, die hängen bleiben soll.]",
          "[Quelle oder Einordnung]")
    fuss(s)

    # ── 14 · 2x2-Matrix (hell) ───────────────────────────────────────
    setze_modus("hell")
    s = folie(prs)
    kopfzeile(s, "Einordnung", [("Vier Felder, ein ", GRAPHIT), ("Bild", STAHL_TIEF), (".", GRAPHIT)])
    matrix2x2(s, [("[Oben links]", "[Kurztext.]"), ("[Oben rechts]", "[Kurztext.]"),
                  ("[Unten links]", "[Kurztext.]"), ("[Unten rechts]", "[Kurztext.]")],
              RAND + Inches(0.5), INHALT_Y, Inches(9.5), Inches(3.9),
              achse_x=("[wenig Aufwand]", "[viel Aufwand]"))
    fuss(s)

    # ── 15 · Positionen / Preis (hell) ───────────────────────────────
    s = folie(prs)
    kopfzeile(s, "Positionen", [("Leistung und ", GRAPHIT), ("Preis", STAHL_TIEF), (".", GRAPHIT)])
    y = INHALT_Y + Inches(0.1)
    for pos, beschr, preis in [("01", "[Position eins]", "[0.000 €]"),
                               ("02", "[Position zwei]", "[0.000 €]"),
                               ("03", "[Position drei]", "[inklusive]")]:
        linie_h(s, RAND, y, BREITE - 2 * RAND)
        textblock(s, RAND, y + Inches(0.18), Inches(0.8), Inches(0.4),
                  [[(pos, MONO, 12, STAHL_TIEF, False, 200)]])
        textblock(s, RAND + Inches(0.9), y + Inches(0.15), Inches(7.6), Inches(0.5),
                  [[(beschr, TEXT, 14, GRAPHIT)]])
        textblock(s, BREITE - RAND - Inches(2.6), y + Inches(0.15), Inches(2.6), Inches(0.5),
                  [[(preis, DISPLAY, 14, GRAPHIT, True), {"align": PP_ALIGN.RIGHT}]])
        y += Inches(0.62)
    linie_h(s, RAND, y, BREITE - 2 * RAND, farbe=STAHL_TIEF, staerke=1.2)
    textblock(s, RAND + Inches(0.9), y + Inches(0.15), Inches(6), Inches(0.5),
              [[("Summe netto", DISPLAY, 15, GRAPHIT, True)]])
    textblock(s, BREITE - RAND - Inches(2.6), y + Inches(0.15), Inches(2.6), Inches(0.5),
              [[("[0.000 €]", DISPLAY, 16, STAHL_TIEF, True), {"align": PP_ALIGN.RIGHT}]])
    fliesstext(s, "[Hinweiszeile: zzgl. USt, Nebenkosten, Gültigkeit.]",
               RAND, y + Inches(0.85), Inches(9), groesse=11, blocksatz=False)
    fuss(s)

    # ── 16 · Kontakt / CTA (dunkel) ──────────────────────────────────
    setze_modus("dunkel")
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
    fuss(s)

    prs.save(ziel)
    setze_modus("dunkel")
    print(f"gespeichert: {ziel} ({seite + 0} Folien)")


if __name__ == "__main__":
    baue(sys.argv[1] if len(sys.argv) > 1 else str(HIER / "assets" / "mfd_master.pptx"))
