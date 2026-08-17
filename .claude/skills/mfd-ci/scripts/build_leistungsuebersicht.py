# -*- coding: utf-8 -*-
"""
Leistungsübersicht für den Akquise-Prozess (Anhang zur zweiten E-Mail).

Aufbau: Wer wir sind → Was wir anbieten (Themenkatalog) →
Status-quo-Analyse mit Preis → Förderung → Ablauf → Kontakt.
Unverbindlich; das rechtlich bindende Angebot ist das Word-Dokument
(build_angebot_docx.js).

Individualisieren: KONFIG anpassen und neu bauen:

    python3 build_leistungsuebersicht.py [ziel.pptx]

BETRIEB/ANSPRECHPARTNER leer lassen ("") für die neutrale Fassung,
die ohne Anpassung verschickt werden kann.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from mfd import *  # noqa: F401,F403

HIER = Path(__file__).parent.parent
ASSETS = HIER / "assets"

# ── Individualisierung ───────────────────────────────────────────────
KONFIG = {
    "DATUM": "[TT.MM.JJJJ]",
    "BETRIEB": "",              # z. B. "Schreinerei Huber" oder "" für neutral
    "ANSPRECHPARTNER": "",      # z. B. "Max Huber" oder "" für neutral
    "BEISPIEL_VOLUMEN": 15000,  # Beispielrechnung Förderung (4.000-30.000)
}

DECKNAME = "Leistungsübersicht"
INHALT_Y = Inches(2.45)

THEMEN = [
    ("KI-Tools einführen", "ChatGPT, Claude und Co: das passende Werkzeug "
     "auswählen, sicher einrichten, sinnvoll in den Alltag holen."),
    ("Mitarbeiter schulen", "Praxisnah am eigenen Arbeitsplatz, damit die "
     "Werkzeuge auch wirklich genutzt werden."),
    ("Technik-Infrastruktur", "Analyse der bestehenden Technik: Geräte, "
     "Software, Ablage, Datensicherung. Was fehlt, was ist zu viel."),
    ("Verträge prüfen", "Laufende Verträge mit IT-Dienstleistern und "
     "Website-Tools: was sie kosten und was sie wirklich bringen."),
    ("Angebote automatisieren", "Vom Aufmaß zum fertigen Angebot in Minuten "
     "statt am Abend am Küchentisch."),
    ("Website optimieren", "Die bestehende Website schneller, auffindbarer "
     "und aktuell halten."),
    ("Website erstellen", "Eine neue Website, die Anfragen bringt, statt nur "
     "da zu sein."),
    ("Und mehr", "Jeder Betrieb ist anders. Was bei Ihnen klemmt, schauen "
     "wir uns unverbindlich an."),
]


def euro(n):
    return f"{n:,.0f} €".replace(",", ".")


def kopfzeile(s, sektion, teile, groesse=30):
    massketten_trenner(s, sektion, Inches(0.7))
    headline(s, teile, y=Inches(1.4), groesse=groesse)


def baue(ziel):
    k = KONFIG
    zuschuss = min(k["BEISPIEL_VOLUMEN"] * 0.5, 7500)
    eigen = k["BEISPIEL_VOLUMEN"] - zuschuss
    prs = neues_deck()
    seite = 0

    def fuss(s):
        nonlocal seite
        seite += 1
        fusszeile(s, DECKNAME, seite)

    # ── 1 · Cover (dunkel) ───────────────────────────────────────────
    setze_modus("dunkel")
    s = folie(prs)
    bild(s, str(ASSETS / "k4-buero-nacht.jpg"), 0, 0, BREITE, HOEHE, abdunkeln=68)
    textblock(s, RAND, Inches(0.55), Inches(8), Inches(0.4),
              [[("MAINFRANKEN ", DISPLAY, 15, SILBER, True, 150),
                ("DIGITAL", DISPLAY, 15, STAHL, True, 150)]])
    kicker(s, "Leistungsübersicht", y=Inches(2.45), farbe=STAHL)
    ziel_txt = k["BETRIEB"] or "Ihren Handwerksbetrieb"
    headline(s, [("KI und Digitalisierung für\n", SILBER), (ziel_txt, STAHL), (".", SILBER)],
             y=Inches(2.9), groesse=40)
    fliesstext(s, "Weniger Zeit für Büro und Verwaltung. Von der ersten "
                  "Analyse bis zur fertigen Umsetzung, mit bis zu 50 % Förderung.",
               RAND, Inches(4.6), Inches(8.2), groesse=14, blocksatz=False, farbe=NEBEL)
    meta = k["DATUM"]
    if k["ANSPRECHPARTNER"]:
        meta += f"  ·  FÜR {k['ANSPRECHPARTNER'].upper()}"
    meta += "  ·  UNVERBINDLICHE ÜBERSICHT"
    textblock(s, RAND, HOEHE - Inches(0.95), Inches(11), Inches(0.4),
              [[(meta, MONO, 10, GEDIMMT, False, 200)]])
    seite += 1

    # ── 2 · Wer wir sind (hell) ──────────────────────────────────────
    setze_modus("hell")
    s = folie(prs)
    kopfzeile(s, "Wer wir sind", [("Beratung, die auch ", GRAPHIT),
                                  ("umsetzt", STAHL_TIEF), (".", GRAPHIT)])
    portraet_rund(s, str(ASSETS / "oliver-portraet.jpg"), RAND, INHALT_Y + Inches(0.15), Inches(1.5))
    textblock(s, RAND + Inches(1.95), INHALT_Y + Inches(0.18), Inches(4.6), Inches(1.6),
              [[("Oliver Fieder", DISPLAY, 16, GRAPHIT, True)],
               [("Gründer und Berater, Mainfranken Digital", TEXT, 11, GRAU_HELL),
                {"abstand_vor": Pt(2)}],
               [("Ein Angebot der Fieder Handels GmbH, Würzburg.", TEXT, 11, SCHIEFER),
                {"abstand_vor": Pt(6)}]])
    bullets(s, [("Unternehmer seit dem 15. Lebensjahr", "über sechs Jahre selbstständig."),
                ("Rund drei Jahre Beratung", "in Projekten unter anderem mit Kunden wie Siemens."),
                ("Keine Papierberge", "wir richten ein, weisen ein und bleiben erreichbar, "
                 "bis es im Alltag läuft.")],
            RAND + Inches(7.0), INHALT_Y + Inches(0.15), Inches(4.7), groesse=12.5)
    fliesstext(s, "Wir digitalisieren Büro und Verwaltung in Handwerksbetrieben: "
                  "Angebote, Rechnungen, Ablage, Wissensfragen. Durch Digitalisierung "
                  "und den Einsatz künstlicher Intelligenz werden Abläufe effizienter, "
                  "damit auch das Büro endlich Feierabend hat.",
               RAND, INHALT_Y + Inches(2.15), Inches(11.2), Inches(1.3), groesse=13)
    fuss(s)

    # ── 3 · Themenkatalog (hell) ─────────────────────────────────────
    s = folie(prs)
    kopfzeile(s, "Leistungen", [("Was wir für Ihren Betrieb ", GRAPHIT),
                                ("anbieten", STAHL_TIEF), (".", GRAPHIT)])
    kw = (BREITE - 2 * RAND - 3 * Inches(0.32)) / 4
    kh = Inches(1.86)
    for i, (titel, text) in enumerate(THEMEN):
        x = RAND + (i % 4) * (kw + Inches(0.32))
        y = INHALT_Y + (i // 4) * (kh + Inches(0.3))
        karte(s, x, y, kw, kh, betont=(i == len(THEMEN) - 1))
        textblock(s, x + Inches(0.24), y + Inches(0.2), kw - Inches(0.48), Inches(0.35),
                  [[(f"0{i+1}", MONO, 12, STAHL_TIEF, True)]])
        textblock(s, x + Inches(0.24), y + Inches(0.52), kw - Inches(0.48), Inches(0.55),
                  [[(titel, DISPLAY, 12.5, GRAPHIT, True)]])
        fliesstext(s, text, x + Inches(0.24), y + Inches(0.98), kw - Inches(0.48),
                   kh - Inches(1.1), groesse=8.8, blocksatz=False)
    fuss(s)

    # ── 4 · Status-quo-Analyse: das kostet es (hell) ─────────────────
    s = folie(prs)
    kopfzeile(s, "Einstieg", [("Der Einstieg: die ", GRAPHIT),
                              ("Status-quo-Analyse", STAHL_TIEF), (".", GRAPHIT)])
    kw = (BREITE - 2 * RAND - Inches(0.5)) / 2
    karten = [
        ("Schritt 1", "Status-quo-Analyse (Digital-Check)", True,
         "Ein Tag vor Ort in Ihrem Betrieb. Wir nehmen die Abläufe in Büro "
         "und Verwaltung auf. Danach haben Sie schwarz auf weiß, was sich "
         "bei Ihnen lohnt, was es kostet und was es bringt.",
         "1.900 € netto"),
        ("Schritt 2", "Umsetzungsprojekt", False,
         "Die Maßnahmen aus der Analyse werden eingerichtet und so lange "
         "angepasst, bis sie in Ihren Alltag passen. Digitalbonus und "
         "Antrag klären wir vorher gemeinsam.",
         "ab 10.000 €, typisch 15.000 €"),
    ]
    for i, (schritt, titel, betont, text, preis) in enumerate(karten):
        x = RAND + i * (kw + Inches(0.5))
        karte(s, x, INHALT_Y, kw, Inches(3.75), betont=betont)
        pille(s, schritt, x + Inches(0.4), INHALT_Y + Inches(0.35))
        textblock(s, x + Inches(0.4), INHALT_Y + Inches(0.92), kw - Inches(0.8), Inches(0.55),
                  [[(titel, DISPLAY, 17, GRAPHIT, True)]])
        fliesstext(s, text, x + Inches(0.4), INHALT_Y + Inches(1.52), kw - Inches(0.8),
                   Inches(1.4), groesse=12)
        textblock(s, x + Inches(0.4), INHALT_Y + Inches(3.02), kw - Inches(0.8), Inches(0.5),
                  [[(preis, DISPLAY, 16, STAHL_TIEF, True)]])
    fuss(s)

    # ── 5 · Förderung (hell) ─────────────────────────────────────────
    s = folie(prs)
    kopfzeile(s, "Förderung", [("Der Digitalbonus Bayern übernimmt bis zu ", GRAPHIT),
                               ("50 %", STAHL_TIEF), (".", GRAPHIT)], groesse=27)
    zb = Inches(2.55)
    for i, (wert, label) in enumerate([("50 %", "der Projektkosten"),
                                       ("7.500 €", "Höchstzuschuss"),
                                       ("4.000 €", "Mindestvolumen")]):
        zahl(s, wert, label, RAND + i * zb, Inches(2.85), w=Inches(2.4), wert_groesse=34)
    kx = RAND + 3 * zb + Inches(0.35)
    kw2 = BREITE - RAND - kx
    karte(s, kx, Inches(2.6), kw2, Inches(2.35), betont=True)
    textblock(s, kx + Inches(0.35), Inches(2.9), kw2 - Inches(0.7), Inches(1.95),
              [[("BEISPIELRECHNUNG", MONO, 9, STAHL_TIEF, False, 220)],
               [(f"Projekt {euro(k['BEISPIEL_VOLUMEN'])}", TEXT, 12, SCHIEFER), {"abstand_vor": Pt(10)}],
               [(f"Zuschuss {euro(zuschuss)}", DISPLAY, 15, GRAPHIT, True), {"abstand_vor": Pt(4)}],
               [(f"Ihr Anteil {euro(eigen)}", DISPLAY, 15, STAHL_TIEF, True), {"abstand_vor": Pt(2)}]])
    linie_h(s, RAND, Inches(5.35), BREITE - 2 * RAND)
    fliesstext(s, "Angaben ohne Gewähr; maßgeblich sind die aktuellen Bedingungen "
                  "unter digitalbonus.bayern.de. Ob Ihr Betrieb die Voraussetzungen "
                  "erfüllt und wie der Antrag läuft, klären wir im Erstgespräch.",
               RAND, Inches(5.55), Inches(9.5), groesse=11, blocksatz=False)
    fuss(s)

    # ── 6 · Ablauf (hell) ────────────────────────────────────────────
    s = folie(prs)
    kopfzeile(s, "Ablauf", [("Vier Schritte bis zum ", GRAPHIT),
                            ("Feierabend", STAHL_TIEF), (".", GRAPHIT)])
    sw = (BREITE - 2 * RAND - 3 * Inches(0.4)) / 4
    for i, (titel, text) in enumerate([
            ("Erstgespräch", "Eine halbe Stunde, unverbindlich und kostenfrei. "
             "Sie erzählen, wo es klemmt."),
            ("Digital-Check", "Ein Tag vor Ort. Danach wissen Sie, was sich "
             "lohnt, was es kostet und was es bringt."),
            ("Angebot und Antrag", "Festes Angebot für die Umsetzung. "
             "Digitalbonus-Antrag klären wir vorher gemeinsam."),
            ("Umsetzung", "Einrichten, anpassen, einweisen. Ich bleibe "
             "erreichbar, wenn etwas hakt.")]):
        x = RAND + i * (sw + Inches(0.4))
        karte(s, x, INHALT_Y, sw, Inches(3.3))
        textblock(s, x + Inches(0.3), INHALT_Y + Inches(0.3), sw - Inches(0.6), Inches(0.7),
                  [[(f"0{i+1}", MONO, 26, STAHL_TIEF, True)]])
        textblock(s, x + Inches(0.3), INHALT_Y + Inches(1.1), sw - Inches(0.6), Inches(0.75),
                  [[(titel, DISPLAY, 13.5, GRAPHIT, True)]])
        fliesstext(s, text, x + Inches(0.3), INHALT_Y + Inches(1.75), sw - Inches(0.6),
                   Inches(1.45), groesse=10.5, blocksatz=False)
    fuss(s)

    # ── 7 · Kontakt (dunkel) ─────────────────────────────────────────
    setze_modus("dunkel")
    s = folie(prs)
    massketten_trenner(s, "Kontakt", Inches(0.75))
    headline(s, [("Der nächste Schritt ist ein ", SILBER), ("Gespräch", STAHL), (".", SILBER)],
             y=Inches(1.55), groesse=30)
    karte(s, RAND, Inches(2.65), BREITE - 2 * RAND, Inches(2.7), betont=True)
    portraet_rund(s, str(ASSETS / "oliver-portraet.jpg"), RAND + Inches(0.5), Inches(3.15), Inches(1.7))
    textblock(s, RAND + Inches(2.6), Inches(3.1), Inches(5.3), Inches(2.1),
              [[("Oliver Fieder", DISPLAY, 17, SILBER, True)],
               [("Gründer und Berater, Mainfranken Digital", TEXT, 11, GEDIMMT), {"abstand_vor": Pt(2)}],
               [("Das Erstgespräch dauert eine halbe Stunde, ist kostenfrei "
                 "und unverbindlich. Danach wissen Sie, ob sich Digitalisierung "
                 "und KI für Ihren Betrieb lohnen.", TEXT, 11, NEBEL),
                {"abstand_vor": Pt(8), "zeilenabstand": 1.25}]])
    textblock(s, BREITE - RAND - Inches(3.6), Inches(3.1), Inches(3.2), Inches(1.3),
              [[("0179 213 74 76", DISPLAY, 14, SILBER, True)],
               [("oliver@mainfranken-digital.de", TEXT, 11, NEBEL), {"abstand_vor": Pt(4)}],
               [("Versbacher Straße 20 · 97078 Würzburg", TEXT, 11, NEBEL), {"abstand_vor": Pt(4)}]])
    cta(s, "Gespräch vereinbaren", BREITE - RAND - Inches(3.6), Inches(4.45),
        link="https://calendly.com/oliver2004-fieder/30min")
    fliesstext(s, "Diese Übersicht ist unverbindlich und kostenfrei. Ein Angebot im "
                  "Rechtssinne erhalten Sie nach dem Erstgespräch.",
               RAND, Inches(5.65), Inches(9), groesse=10, blocksatz=False, farbe=GEDIMMT)
    fuss(s)

    prs.save(ziel)
    setze_modus("dunkel")
    print(f"gespeichert: {ziel} ({seite} Folien)")


if __name__ == "__main__":
    baue(sys.argv[1] if len(sys.argv) > 1 else "leistungsuebersicht.pptx")
