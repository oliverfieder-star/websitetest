---
name: mfd-pptx
description: "PowerPoint-Folienmaster und Angebotsvorlagen im Corporate Design von Mainfranken Digital (Fieder Handels GmbH) — die Werkfilm-Designsprache der Website als Folien: Graphit #0D0F12, Stahl-Akzent #8FA9BD, Space Grotesk, Mono-Kicker, Maßketten-Trenner. Use this skill whenever a PowerPoint/Folie/Deck/Präsentation/Pitch/Angebot for Mainfranken Digital is needed — auch wenn nur 'ein Angebot für [Kunde]', 'Nachfass-Mail mit Anhang', 'Angebot individualisieren', 'Digital-Check-Angebot' oder 'Folien im Website-Look' gesagt wird. Bündelt Folienmaster, CI-Regeln, Builder-Skripte und zwei Angebotsvorlagen (V1 Nachfass unverbindlich, V2 verbindliches Angebot Status-quo-Analyse). Do NOT use the generic pptx skill for Mainfranken-Digital-Decks — dieses Skill enthält CI, Stammdaten und fachlich fixe Preise/Förderlogik."
---

# Mainfranken Digital — PowerPoint-Skill (Werkfilm-CI)

Erstellt Folien und Angebote im Corporate Design von Mainfranken
Digital, abgeleitet aus der Website (dunkler Werkfilm-Look).

## Was dieses Skill bündelt

1. **`scripts/mfd.py`** — Builder-Bibliothek (python-pptx): Farben,
   Schriften und alle CI-Bausteine (Kicker, Maßketten-Trenner,
   Headline mit Stahl-Akzent, Karten, Pillen, CTA, Kennzahlen,
   rundes Porträt, Fußzeile).
2. **`scripts/build_master.py`** — baut `assets/mfd_master.pptx`:
   acht Layout-Folien als Kopiervorlage (Cover, Aussage, Zwei Karten,
   Kennzahlen, Vier Schritte, Positionen, Kontakt/CTA,
   Konditionen+Unterschrift).
3. **`scripts/build_angebot_nachfass.py`** — Angebotsvorlage V1:
   unverbindliche Übersicht für die zweite E-Mail nach Erstkontakt.
4. **`scripts/build_angebot_digitalcheck.py`** — Angebotsvorlage V2:
   verbindliches Angebot für die Status-quo-Analyse (Digital-Check)
   nach geführtem Erstgespräch, mit Konditionen und Unterschriftsblock.
5. **`references/ci.md`** — CI-Regeln, Sprache, fachlich fixe Zahlen,
   Stammdaten. **Pflichtlektüre vor jeder Folie.**
6. **`assets/`** — Porträt, Hallen-Coverbilder, Space-Grotesk-TTFs,
   gebauter Folienmaster.

## Workflow

### Neues Deck oder neue Folie

1. `references/ci.md` lesen (Farben, Sprache, fachliche Fixpunkte).
2. Outline im Chat zeigen (Folie für Folie, mit Layout-Typ aus dem
   Master), bei ausdrücklichem Wunsch direkt bauen.
3. Bauen: eigenes Build-Skript nach dem Muster der Angebots-Skripte
   schreiben (import mfd, Layout-Bausteine kombinieren). Nicht von
   Hand in XML arbeiten; die Bibliothek deckt alle CI-Bausteine ab.
4. QA (Pflicht, nie überspringen):
   ```bash
   soffice --headless --convert-to pdf --outdir /tmp deck.pptx
   pdftoppm -jpeg -r 85 /tmp/deck.pdf /tmp/folie
   # jede Folie ansehen: Überlappungen, Umbrüche, Platzhalter
   ```
   Vor dem Rendern die TTFs aus `assets/fonts/` nach `~/.fonts`
   kopieren und `fc-cache -f` laufen lassen, sonst rendert eine
   Ersatzschrift. Fehlt `pdftoppm`/Impress:
   `sudo apt-get install -y libreoffice-impress poppler-utils`.
5. Auf verbliebene `[PLATZHALTER]` prüfen: im fertigen Kundendokument
   darf keiner mehr stehen (in den Vorlagen sind sie Absicht).

### Angebot individualisieren

Nur das `KONFIG`-Dict am Kopf des jeweiligen Build-Skripts anpassen
(Betrieb, Ansprechpartner, Datum, Bezugstext, ggf. Beispielvolumen),
dann neu bauen:

```bash
cd .claude/skills/mfd-pptx/scripts
python3 build_angebot_nachfass.py /pfad/angebot-<kunde>.pptx
python3 build_angebot_digitalcheck.py /pfad/angebot-<kunde>.pptx
```

Wann welche Vorlage:
- **V1 Nachfass** (`build_angebot_nachfass.py`): zweite E-Mail nach
  Erstkontakt, noch kein Gespräch geführt. Unverbindlich, endet im
  Calendly-CTA. Enthält den Hinweis „kein Angebot im Rechtssinne“.
- **V2 Digital-Check** (`build_angebot_digitalcheck.py`): nach dem
  Erstgespräch, rechtlich bindend (Bindefrist, Vergütung 1.900 € netto
  + USt, Konditionen, Unterschriftsblock). Bindefrist üblich:
  Angebotsdatum + 30 Tage. Preise und Förderlogik nie ändern.

## Rote Linien

- Fachlich fixe Zahlen (1.900 € netto, ab 10.000 €, 50 % / 7.500 € /
  4.000 € Digitalbonus) niemals anpassen oder erfinden — siehe
  `references/ci.md`.
- Keine Gedankenstriche in Texten. Versalien-Headlines mit genau
  einem Stahl-Akzentwort und Schlusspunkt.
- Keine erfundenen Referenzen, Kundennamen oder Erfolgsquoten.
- V2 ist ein rechtlich bindendes Dokument: Änderungen an den
  Konditionen nur auf ausdrücklichen Wunsch des Nutzers.

## Verzeichnisstruktur

```
mfd-pptx/
├── SKILL.md
├── references/
│   └── ci.md                          — CI, Sprache, Fixpunkte, Stammdaten
├── scripts/
│   ├── mfd.py                         — Builder-Bibliothek
│   ├── build_master.py                — Folienmaster (8 Layouts)
│   ├── build_angebot_nachfass.py      — Vorlage V1 (unverbindlich)
│   └── build_angebot_digitalcheck.py  — Vorlage V2 (verbindlich)
└── assets/
    ├── mfd_master.pptx                — gebauter Folienmaster
    ├── oliver-portraet.jpg            — Porträt (rund einsetzen)
    ├── k1-nachmittag.jpg              — Cover hell (Halle, Nachmittag)
    ├── k4-buero-nacht.jpg             — Cover dunkel (Glasbüro, Nacht)
    └── fonts/                         — Space Grotesk TTF (Reg/Med/Bold)
```
