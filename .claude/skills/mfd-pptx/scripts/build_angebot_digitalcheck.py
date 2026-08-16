# -*- coding: utf-8 -*-
"""
Angebotsvorlage V2 — Verbindliches Angebot: Status-quo-Analyse
(Digital-Check), nach geführtem Erstgespräch.

Rechtlich bindendes Angebot mit Leistungsumfang, Vergütung,
Konditionen und Unterschriftsblock. Zum Individualisieren nur das
KONFIG-Dict anpassen und neu bauen:

    python3 build_angebot_digitalcheck.py [ziel.pptx]

Fachlich fix: Digital-Check pauschal 1.900 € netto.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from mfd import *  # noqa: F401,F403

HIER = Path(__file__).parent.parent
ASSETS = HIER / "assets"

# ── Individualisierung: nur diesen Block anpassen ────────────────────
KONFIG = {
    "ANGEBOTS_NR": "[JJJJ-NNN]",
    "DATUM": "[TT.MM.JJJJ]",
    "BINDEFRIST": "[TT.MM.JJJJ]",          # üblich: Datum + 30 Tage
    "KUNDE_FIRMA": "[Firma des Auftraggebers]",
    "KUNDE_ANSCHRIFT": "[Straße Nr. · PLZ Ort]",
    "KUNDE_ANSPRECHPARTNER": "[Vorname Nachname]",
    # Kern des Erstgesprächs in zwei, drei Sätzen: Wo klemmt es,
    # was soll die Analyse klären?
    "AUSGANGSLAGE": "[Aus dem Erstgespräch am TT.MM.: Die Angebots- und "
                    "Rechnungsstellung läuft handschriftlich bzw. verstreut "
                    "über mehrere Systeme; die Ablage kostet spürbar Zeit. "
                    "Die Analyse soll klären, welche Abläufe sich mit "
                    "welchem Aufwand digitalisieren lassen.]",
    "ANALYSETAG": "nach gemeinsamer Terminabstimmung",
}

PREIS_NETTO = 1900
UST = round(PREIS_NETTO * 0.19)
BRUTTO = PREIS_NETTO + UST
DECKNAME = "Angebot Status-quo-Analyse"


def euro(n):
    return f"{n:,.0f} €".replace(",", ".")


def baue(ziel):
    k = KONFIG
    prs = neues_deck()

    # ── 1 · Cover ────────────────────────────────────────────────────
    s = folie(prs)
    bild(s, str(ASSETS / "k1-nachmittag.jpg"), 0, 0, BREITE, HOEHE, abdunkeln=76)
    textblock(s, RAND, Inches(0.55), Inches(8), Inches(0.4),
              [[("MAINFRANKEN ", DISPLAY, 15, SILBER, True, 150),
                ("DIGITAL", DISPLAY, 15, STAHL, True, 150)]])
    kicker(s, f"Verbindliches Angebot · Nr. {k['ANGEBOTS_NR']}", y=Inches(2.1))
    headline(s, [("Status-quo-Analyse\n", SILBER), ("Digital-Check", STAHL), (".", SILBER)],
             y=Inches(2.55), groesse=40)
    textblock(s, RAND, Inches(4.5), Inches(7.5), Inches(1.6),
              [[("FÜR", MONO, 9, GEDIMMT, False, 260)],
               [(k["KUNDE_FIRMA"], DISPLAY, 15, SILBER, True), {"abstand_vor": Pt(6)}],
               [(k["KUNDE_ANSCHRIFT"], TEXT, 11, NEBEL), {"abstand_vor": Pt(3)}],
               [(f"z. Hd. {k['KUNDE_ANSPRECHPARTNER']}", TEXT, 11, NEBEL), {"abstand_vor": Pt(2)}]])
    textblock(s, RAND, HOEHE - Inches(0.95), Inches(11.5), Inches(0.4),
              [[(f"{k['DATUM']}  ·  GEBUNDEN BIS {k['BINDEFRIST']}  ·  "
                 f"FIEDER HANDELS GMBH", MONO, 10, GEDIMMT, False, 200)]])

    # ── 2 · Ausgangslage und Ziel ───────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Ausgangslage", Inches(0.75))
    headline(s, [("Was die Analyse ", SILBER), ("klären soll", STAHL), (".", SILBER)],
             y=Inches(1.55), groesse=32)
    fliesstext(s, [k["AUSGANGSLAGE"],
                   "Ziel der Status-quo-Analyse: ein belastbares Bild Ihrer Abläufe "
                   "in Büro und Verwaltung, eine priorisierte Maßnahmenliste mit "
                   "Aufwands- und Nutzenschätzung sowie eine Einschätzung, welche "
                   "Maßnahmen über den Digitalbonus Bayern förderfähig sind. Danach "
                   "können Sie fundiert entscheiden, ob und was Sie umsetzen."],
               RAND, Inches(2.6), Inches(9.2), Inches(3.4), groesse=14)
    fusszeile(s, DECKNAME, 2)

    # ── 3 · Leistungsumfang ─────────────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Leistungsumfang", Inches(0.75))
    headline(s, [("Was im Digital-Check ", SILBER), ("drinsteckt", STAHL), (".", SILBER)],
             y=Inches(1.55), groesse=32)
    sw = (BREITE - 2 * RAND - 3 * Inches(0.4)) / 4
    y0 = Inches(2.55)
    for i, (titel, text) in enumerate([
            ("Vorbereitung", "Kurzfragebogen vorab und Sichtung vorhandener Unterlagen und Systeme."),
            ("Analysetag vor Ort", f"Ein Tag in Ihrem Betrieb ({k['ANALYSETAG']}): Aufnahme der Abläufe in Büro und Verwaltung, Gespräche mit den Beteiligten."),
            ("Ergebnisbericht", "Schriftlich: Ist-Aufnahme, priorisierte Maßnahmen mit Aufwands- und Nutzenschätzung, Einschätzung zur Förderfähigkeit."),
            ("Ergebnisgespräch", "Rund 60 Minuten, vor Ort oder online: Bericht durchgehen, Fragen klären, mögliche nächste Schritte.")]):
        x = RAND + i * (sw + Inches(0.4))
        karte(s, x, y0, sw, Inches(3.55))
        textblock(s, x + Inches(0.3), y0 + Inches(0.3), sw - Inches(0.6), Inches(0.7),
                  [[(f"0{i+1}", MONO, 26, STAHL, True)]])
        textblock(s, x + Inches(0.3), y0 + Inches(1.1), sw - Inches(0.6), Inches(0.75),
                  [[(titel, DISPLAY, 13, SILBER, True)]])
        fliesstext(s, text, x + Inches(0.3), y0 + Inches(1.72), sw - Inches(0.6),
                   Inches(1.7), groesse=10, blocksatz=False)
    fusszeile(s, DECKNAME, 3)

    # ── 4 · Vergütung ───────────────────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Vergütung", Inches(0.75))
    headline(s, [("Ein fester Preis, keine ", SILBER), ("Überraschungen", STAHL), (".", SILBER)],
             y=Inches(1.55), groesse=32)
    y = Inches(2.7)
    zeilen = [("01", "Status-quo-Analyse (Digital-Check), pauschal", euro(PREIS_NETTO)),
              ("02", "An- und Abreise sowie Nebenkosten", "[inklusive / nach Aufwand]"),
              ("", "Umsatzsteuer 19 %", euro(UST))]
    for pos, beschr, preis in zeilen:
        linie_h(s, RAND, y, BREITE - 2 * RAND)
        if pos:
            textblock(s, RAND, y + Inches(0.18), Inches(0.8), Inches(0.4),
                      [[(pos, MONO, 12, STAHL, False, 200)]])
        textblock(s, RAND + Inches(0.9), y + Inches(0.15), Inches(7.6), Inches(0.5),
                  [[(beschr, TEXT, 14, SILBER)]])
        textblock(s, BREITE - RAND - Inches(3.2), y + Inches(0.15), Inches(3.2), Inches(0.5),
                  [[(preis, DISPLAY, 14, SILBER, True), {"align": PP_ALIGN.RIGHT}]])
        y += Inches(0.62)
    linie_h(s, RAND, y, BREITE - 2 * RAND, farbe=STAHL, staerke=1.2)
    textblock(s, RAND + Inches(0.9), y + Inches(0.18), Inches(6), Inches(0.5),
              [[("Gesamt brutto", DISPLAY, 15, SILBER, True)]])
    textblock(s, BREITE - RAND - Inches(3.2), y + Inches(0.15), Inches(3.2), Inches(0.5),
              [[(euro(BRUTTO), DISPLAY, 17, STAHL, True), {"align": PP_ALIGN.RIGHT}]])
    fliesstext(s, "Der Digital-Check ist bewusst so geschnitten, dass er für sich "
                  "steht: Sie erhalten ein Ergebnis, mit dem Sie auch ohne "
                  "Folgeauftrag arbeiten können. Ein späteres Umsetzungsprojekt "
                  "wird separat angeboten (ab 10.000 €, mit Digitalbonus Bayern "
                  "bis zu 50 % gefördert).",
               RAND, y + Inches(0.85), Inches(9.6), Inches(1.0), groesse=11, blocksatz=False)
    fusszeile(s, DECKNAME, 4)

    # ── 5 · Konditionen und Annahme ─────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Konditionen", Inches(0.75))
    headline(s, [("Konditionen und ", SILBER), ("Annahme", STAHL), (".", SILBER)],
             y=Inches(1.45), groesse=28)
    fliesstext(s, [f"Bindefrist: An dieses Angebot halten wir uns bis zum {k['BINDEFRIST']} gebunden.",
                   "Terminierung: Der Analysetag wird nach Beauftragung gemeinsam "
                   "festgelegt; Verschiebungen sind bis 5 Werktage vorher kostenfrei.",
                   "Zahlung: Rechnung nach dem Ergebnisgespräch, zahlbar innerhalb "
                   "von 14 Tagen ohne Abzug.",
                   "Mitwirkung: Am Analysetag stehen Räume, Unterlagen und die "
                   "relevanten Ansprechpartner zur Verfügung.",
                   "Vertraulichkeit: Beide Seiten behandeln alle im Projekt "
                   "erlangten Informationen vertraulich.",
                   "Annahme: Durch Gegenzeichnung dieses Angebots oder Bestätigung "
                   "in Textform (E-Mail genügt)."],
               RAND, Inches(2.3), Inches(6.4), Inches(3.0), groesse=11)
    fliesstext(s, "Fieder Handels GmbH · Versbacher Straße 20 · 97078 Würzburg · "
                  "Amtsgericht Würzburg, HRB 17397 · Geschäftsführer: Oliver Fieder · "
                  "USt-ID DE3370133371 · Telefon 0179 213 74 76 · "
                  "oliver@mainfranken-digital.de. „Mainfranken Digital“ ist ein "
                  "Angebot der Fieder Handels GmbH.",
               RAND, Inches(5.55), Inches(6.4), Inches(1.2), groesse=9, blocksatz=False)
    ux = BREITE - RAND - Inches(4.4)
    for i, wer in enumerate([f"Ort, Datum · {k['KUNDE_FIRMA']} (Auftraggeber)",
                             f"Würzburg, {k['DATUM']} · Fieder Handels GmbH, Oliver Fieder"]):
        y = Inches(2.75) + i * Inches(1.65)
        linie_h(s, ux, y + Inches(0.75), Inches(4.4), farbe=NEBEL)
        textblock(s, ux, y + Inches(0.85), Inches(4.4), Inches(0.55),
                  [[(wer, TEXT, 10, GEDIMMT)]])
    fusszeile(s, DECKNAME, 5)

    prs.save(ziel)
    print(f"gespeichert: {ziel}")


if __name__ == "__main__":
    baue(sys.argv[1] if len(sys.argv) > 1 else "angebot-digital-check.pptx")
