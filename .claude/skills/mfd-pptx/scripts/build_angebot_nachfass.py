# -*- coding: utf-8 -*-
"""
Angebotsvorlage V1 — Nachfass nach Erstkontakt (zweite E-Mail).

Unverbindliche Übersicht: was Mainfranken Digital anbietet, was die
Förderung leistet, wie der Einstieg aussieht. Zum Individualisieren
nur das KONFIG-Dict anpassen und neu bauen:

    python3 build_angebot_nachfass.py [ziel.pptx]

Fachlich fix (nicht ändern): Digital-Check 1.900 € netto; Umsetzung
ab 10.000 €, typisch 15.000 €; Digitalbonus Bayern 50 %, gedeckelt
7.500 €, Mindestvolumen 4.000 €.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from mfd import *  # noqa: F401,F403

HIER = Path(__file__).parent.parent
ASSETS = HIER / "assets"

# ── Individualisierung: nur diesen Block anpassen ────────────────────
KONFIG = {
    "BETRIEB": "[Name des Betriebs]",
    "ANSPRECHPARTNER": "[Vorname Nachname]",
    "DATUM": "[TT.MM.JJJJ]",
    # Zwei, drei Sätze Bezug auf den ersten Kontakt: Worüber wurde
    # gesprochen oder geschrieben? Was war der Aufhänger?
    "BEZUG": "[Bezug auf den Erstkontakt: Sie hatten erwähnt, dass die "
             "Angebotsschreibung und die Ablage viel Zeit fressen. Genau "
             "dort setzen wir an.]",
    # Beispielrechnung für die Förderfolie (netto, 4.000-30.000)
    "BEISPIEL_VOLUMEN": 15000,
}

DECKNAME = "Angebot zur Zusammenarbeit"


def euro(n):
    return f"{n:,.0f} €".replace(",", ".")


def baue(ziel):
    k = KONFIG
    zuschuss = min(k["BEISPIEL_VOLUMEN"] * 0.5, 7500)
    eigen = k["BEISPIEL_VOLUMEN"] - zuschuss

    prs = neues_deck()

    # ── 1 · Cover ────────────────────────────────────────────────────
    s = folie(prs)
    bild(s, str(ASSETS / "k4-buero-nacht.jpg"), 0, 0, BREITE, HOEHE, abdunkeln=68)
    textblock(s, RAND, Inches(0.55), Inches(8), Inches(0.4),
              [[("MAINFRANKEN ", DISPLAY, 15, SILBER, True, 150),
                ("DIGITAL", DISPLAY, 15, STAHL, True, 150)]])
    kicker(s, "Angebot zur Zusammenarbeit", y=Inches(2.45))
    headline(s, [("KI und Digitalisierung für\n", SILBER),
                 (k["BETRIEB"], STAHL), (".", SILBER)],
             y=Inches(2.9), groesse=40)
    fliesstext(s, "Weniger Zeit für Büro und Verwaltung. Von der ersten "
                  "Analyse bis zur fertigen Umsetzung, mit bis zu 50 % Förderung.",
               RAND, Inches(4.6), Inches(8.2), groesse=14, blocksatz=False)
    textblock(s, RAND, HOEHE - Inches(0.95), Inches(11), Inches(0.4),
              [[(f"{k['DATUM']}  ·  FÜR {k['ANSPRECHPARTNER'].upper()}  ·  UNVERBINDLICHE ÜBERSICHT",
                 MONO, 10, GEDIMMT, False, 200)]])

    # ── 2 · Ausgangslage ────────────────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Ausgangslage", Inches(0.75))
    headline(s, [("Das Büro macht bei Ihnen ", SILBER), ("Überstunden", STAHL), (".", SILBER)],
             y=Inches(1.55), groesse=32)
    fliesstext(s, [k["BEZUG"],
                   "Wir digitalisieren Büro und Verwaltung in Handwerksbetrieben: "
                   "Angebote, Rechnungen, Ablage, Wissensfragen. Durch Digitalisierung "
                   "und den Einsatz künstlicher Intelligenz werden Abläufe effizienter, "
                   "damit auch das Büro endlich Feierabend hat.",
                   "Wichtig dabei: Es bleibt nicht bei Beratung. Wir setzen um, "
                   "richten ein und bleiben erreichbar, bis es im Alltag läuft."],
               RAND, Inches(2.6), Inches(9.2), Inches(3.4), groesse=14)
    fusszeile(s, DECKNAME, 2)

    # ── 3 · Angebot in zwei Schritten ────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Angebot", Inches(0.75))
    headline(s, [("Zwei Schritte, klar ", SILBER), ("getrennt", STAHL), (".", SILBER)],
             y=Inches(1.55), groesse=32)
    kw = (BREITE - 2 * RAND - Inches(0.5)) / 2
    y0 = Inches(2.55)
    karten = [
        ("Schritt 1", "Digital-Check", True,
         "Ein Tag vor Ort in Ihrem Betrieb. Wir nehmen die Abläufe in Büro "
         "und Verwaltung auf. Danach haben Sie schwarz auf weiß, was sich "
         "bei Ihnen lohnt, was es kostet und was es bringt.",
         "1.900 € netto"),
        ("Schritt 2", "Umsetzungsprojekt", False,
         "Die Maßnahmen aus dem Digital-Check werden eingerichtet und so "
         "lange angepasst, bis sie in Ihren Alltag passen. Digitalbonus "
         "und Antrag klären wir vorher gemeinsam.",
         "ab 10.000 €, typisch 15.000 €"),
    ]
    for i, (schritt, titel, betont, text, preis) in enumerate(karten):
        x = RAND + i * (kw + Inches(0.5))
        karte(s, x, y0, kw, Inches(3.85), betont=betont)
        pille(s, schritt, x + Inches(0.4), y0 + Inches(0.4))
        textblock(s, x + Inches(0.4), y0 + Inches(1.0), kw - Inches(0.8), Inches(0.5),
                  [[(titel, DISPLAY, 19, SILBER, True)]])
        fliesstext(s, text, x + Inches(0.4), y0 + Inches(1.6), kw - Inches(0.8),
                   Inches(1.5), groesse=12)
        textblock(s, x + Inches(0.4), y0 + Inches(3.15), kw - Inches(0.8), Inches(0.5),
                  [[(preis, DISPLAY, 16, STAHL, True)]])
    fusszeile(s, DECKNAME, 3)

    # ── 4 · Förderung ───────────────────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Förderung", Inches(0.75))
    headline(s, [("Der Digitalbonus Bayern übernimmt bis zu ", SILBER),
                 ("50 %", STAHL), (".", SILBER)], y=Inches(1.5), groesse=30)
    zb = Inches(2.6)
    for i, (wert, label) in enumerate([("50 %", "der Projektkosten"),
                                       ("7.500 €", "Höchstzuschuss"),
                                       ("4.000 €", "Mindestvolumen")]):
        zahl(s, wert, label, RAND + i * zb, Inches(2.75), w=Inches(2.4), wert_groesse=36)
    kx = RAND + 3 * zb + Inches(0.3)
    kw2 = BREITE - RAND - kx
    karte(s, kx, Inches(2.6), kw2, Inches(2.3), betont=True)
    textblock(s, kx + Inches(0.35), Inches(2.9), kw2 - Inches(0.7), Inches(1.9),
              [[("BEISPIELRECHNUNG", MONO, 9, STAHL, False, 220)],
               [(f"Projekt {euro(k['BEISPIEL_VOLUMEN'])}", TEXT, 12, NEBEL), {"abstand_vor": Pt(10)}],
               [(f"Zuschuss {euro(zuschuss)}", DISPLAY, 15, SILBER, True), {"abstand_vor": Pt(4)}],
               [(f"Ihr Anteil {euro(eigen)}", DISPLAY, 15, STAHL, True), {"abstand_vor": Pt(2)}]])
    linie_h(s, RAND, Inches(5.35), BREITE - 2 * RAND)
    fliesstext(s, "Angaben ohne Gewähr; maßgeblich sind die aktuellen Bedingungen "
                  "unter digitalbonus.bayern.de. Ob Ihr Betrieb die Voraussetzungen "
                  "erfüllt und wie der Antrag läuft, klären wir im Erstgespräch.",
               RAND, Inches(5.55), Inches(9.5), groesse=11, blocksatz=False)
    fusszeile(s, DECKNAME, 4)

    # ── 5 · Ablauf ──────────────────────────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Ablauf", Inches(0.75))
    headline(s, [("Vier Schritte bis zum ", SILBER), ("Feierabend", STAHL), (".", SILBER)],
             y=Inches(1.55), groesse=32)
    sw = (BREITE - 2 * RAND - 3 * Inches(0.4)) / 4
    y0 = Inches(2.55)
    for i, (titel, text) in enumerate([
            ("Erstgespräch", "Eine halbe Stunde, unverbindlich und kostenfrei. Sie erzählen, wo es klemmt."),
            ("Digital-Check", "Ein Tag vor Ort. Danach wissen Sie, was sich lohnt, was es kostet und was es bringt."),
            ("Angebot und Antrag", "Festes Angebot für die Umsetzung. Digitalbonus-Antrag klären wir vorher gemeinsam."),
            ("Umsetzung", "Einrichten, anpassen, einweisen. Ich bleibe erreichbar, wenn etwas hakt.")]):
        x = RAND + i * (sw + Inches(0.4))
        karte(s, x, y0, sw, Inches(3.3))
        textblock(s, x + Inches(0.3), y0 + Inches(0.3), sw - Inches(0.6), Inches(0.7),
                  [[(f"0{i+1}", MONO, 26, STAHL, True)]])
        textblock(s, x + Inches(0.3), y0 + Inches(1.1), sw - Inches(0.6), Inches(0.75),
                  [[(titel, DISPLAY, 13.5, SILBER, True)]])
        fliesstext(s, text, x + Inches(0.3), y0 + Inches(1.75), sw - Inches(0.6),
                   Inches(1.45), groesse=10.5, blocksatz=False)
    fusszeile(s, DECKNAME, 5)

    # ── 6 · Kontakt / nächster Schritt ──────────────────────────────
    s = folie(prs)
    massketten_trenner(s, "Kontakt", Inches(0.75))
    headline(s, [("Der nächste Schritt ist ein ", SILBER), ("Gespräch", STAHL), (".", SILBER)],
             y=Inches(1.55), groesse=30)
    karte(s, RAND, Inches(2.65), BREITE - 2 * RAND, Inches(2.7), betont=True)
    portraet_rund(s, str(ASSETS / "oliver-portraet.jpg"), RAND + Inches(0.5), Inches(3.15), Inches(1.7))
    textblock(s, RAND + Inches(2.6), Inches(3.1), Inches(5.3), Inches(2.1),
              [[("Oliver Fieder", DISPLAY, 17, SILBER, True)],
               [("Gründer und Berater, Mainfranken Digital", TEXT, 11, GEDIMMT), {"abstand_vor": Pt(2)}],
               [("Selbstständig seit dem 15. Lebensjahr, über sechs Jahre "
                 "Unternehmer, seit rund drei Jahren in der Beratung, in "
                 "Projekten unter anderem mit Kunden wie Siemens.", TEXT, 11, NEBEL),
                {"abstand_vor": Pt(8), "zeilenabstand": 1.25}]])
    textblock(s, BREITE - RAND - Inches(3.6), Inches(3.1), Inches(3.2), Inches(1.3),
              [[("0179 213 74 76", DISPLAY, 14, SILBER, True)],
               [("oliver@mainfranken-digital.de", TEXT, 11, NEBEL), {"abstand_vor": Pt(4)}],
               [("Versbacher Straße 20 · 97078 Würzburg", TEXT, 11, NEBEL), {"abstand_vor": Pt(4)}]])
    cta(s, "Gespräch vereinbaren", BREITE - RAND - Inches(3.6), Inches(4.45),
        link="https://calendly.com/oliver2004-fieder/30min")
    fliesstext(s, "Diese Übersicht ist unverbindlich und kostenfrei. Ein Angebot im "
                  "Rechtssinne erhalten Sie nach dem Erstgespräch.",
               RAND, Inches(5.65), Inches(9), groesse=10, blocksatz=False)
    fusszeile(s, DECKNAME, 6)

    prs.save(ziel)
    print(f"gespeichert: {ziel}")


if __name__ == "__main__":
    baue(sys.argv[1] if len(sys.argv) > 1 else "angebot-nachfass.pptx")
