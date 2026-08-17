---
name: mfd-ci
description: "Corporate-Design-Skill für Mainfranken Digital (Fieder Handels GmbH): PowerPoint-Präsentationen, Angebots-Dokumente (Word) und Akquise-Unterlagen in der Werkfilm-Designsprache der Website — heller Beratungs-Modus (Papier #F4F3F0, Stahl-Akzent) für Inhalte, dunkler Werkfilm-Modus (Graphit #0D0F12) für Cover und Kontakt, Space Grotesk, Mono-Kicker, Maßketten-Trenner. Use this skill whenever a Präsentation/Deck/Folien/Pitch, ein Angebot, eine Leistungsübersicht oder ein Kundendokument für Mainfranken Digital gebraucht wird — auch bei Formulierungen wie 'Angebot für [Kunde]', 'Folien für den Betrieb', 'Digital-Check-Angebot', 'Akquise-Anhang', 'Präsentation im Website-Look'. Bündelt CI-Regeln, Stammdaten, fachlich fixe Preise/Förderlogik, Builder für 16 Folien-Layouts, das verbindliche Word-Angebot und die Leistungsübersicht. Do NOT use the generic pptx/docx skills for Mainfranken-Digital-Material."
---

# Mainfranken Digital — CI-Skill (Werkfilm)

Erstellt Präsentationen und Dokumente im Corporate Design von
Mainfranken Digital, abgeleitet aus der Website.

## Design-Logik: zwei Modi, eine Welt

- **Hell ("Beratung")**: Papier-Grund `#F4F3F0`, Graphit-Text,
  Stahl-Tief-Akzent `#4F6E88`. Standard für Inhaltsfolien und
  Dokumente — gut lesbar im Besprechungsraum und im Druck.
- **Dunkel ("Werkfilm")**: Graphit `#0D0F12`, Silber-Text, Stahl
  `#8FA9BD`. Für Cover, Abschnittstrenner, Zitat- und Kontaktfolien —
  der Wiedererkennungswert der Website.

Der Rhythmus eines Decks: dunkles Cover → helle Inhalte → dunkler
Schluss (Kontakt). Umschalten im Code mit `setze_modus("hell"/"dunkel")`.

## Was dieses Skill bündelt

1. **`scripts/mfd.py`** — Builder-Bibliothek (python-pptx), themenfähig.
   Bausteine: `kicker`, `massketten_trenner`, `headline`, `fliesstext`,
   `karte`, `pille`, `cta`, `zahl`, `bullets`, `tabelle`, `zeitstrahl`,
   `matrix2x2`, `zitat`, `balkendiagramm` (nativ, in PowerPoint samt
   Daten editierbar), `portraet_rund`, `bild`, `fusszeile`.
2. **`scripts/build_master.py`** → `assets/mfd_master.pptx`: 16
   Layout-Folien als Kopiervorlage (Cover, Agenda, Abschnittstrenner,
   Aussage, Text+Bullets, Vergleich, Drei Karten, Vier Schritte,
   Zeitplan, Kennzahlen, Diagramm, Tabelle, Zitat, 2x2-Matrix,
   Positionen, Kontakt).
3. **`scripts/build_angebot_docx.js`** (Node, npm-Paket `docx`) —
   das **rechtlich verbindliche Angebot** für die Status-quo-Analyse
   als Word-Dokument: Briefkopf, Leistungsumfang, Vergütung,
   Konditionen, Unterschriftsblock. Unterschriftsreif; auf dessen
   Grundlage wird nach Leistungserbringung die Rechnung gestellt.
4. **`scripts/build_leistungsuebersicht.py`** — die unverbindliche
   **Leistungsübersicht** für den Akquise-Prozess (Anhang zur zweiten
   E-Mail): Wer wir sind → Themenkatalog (8 Leistungen) →
   Status-quo-Analyse mit Preis → Förderung → Ablauf → Kontakt.
5. **`references/ci.md`** — CI-Regeln, Sprache, fachlich fixe Zahlen,
   Stammdaten. **Pflichtlektüre vor jedem Dokument.**
6. **`assets/`** — Porträt, Hallen-Coverbilder, Space-Grotesk-TTFs,
   gebauter Folienmaster.

## Workflow

### Neue Präsentation

1. `references/ci.md` lesen.
2. Outline im Chat zeigen (Folie für Folie, Layout-Typ aus dem Master).
3. Build-Skript nach dem Muster von `build_leistungsuebersicht.py`
   schreiben: `from mfd import *`, Modus-Rhythmus dunkel/hell/dunkel,
   Bausteine kombinieren. Nicht von Hand in XML arbeiten.
4. QA (Pflicht): Fonts installieren (`cp assets/fonts/*.ttf ~/.fonts &&
   fc-cache -f`), dann
   ```bash
   soffice --headless --convert-to pdf --outdir /tmp deck.pptx
   pdftoppm -jpeg -r 85 /tmp/deck.pdf /tmp/folie
   ```
   und jede Folie ansehen (Überlappungen, Umbrüche, Platzhalter).
   Fehlt Impress/Writer/pdftoppm: `sudo apt-get install -y
   libreoffice-impress libreoffice-writer poppler-utils`.
5. Kein `[PLATZHALTER]` im fertigen Kundendokument.

### Verbindliches Angebot (Word)

`KONFIG` am Kopf von `scripts/build_angebot_docx.js` füllen
(Angebotsnummer, Datum, Bindefrist = Datum + 30 Tage, Kunde,
Ausgangslage aus dem Erstgespräch, Nebenkosten-Regel), dann:

```bash
node scripts/build_angebot_docx.js /pfad/angebot-<kunde>.docx
```

Konditionen (Zahlung 14 Tage, Verschiebung bis 5 Werktage,
Vertraulichkeit, Textform-Annahme, Gerichtsstand) nur auf
ausdrücklichen Wunsch des Nutzers ändern — es ist ein bindendes
Dokument. Preis 1.900 € netto ist fix.

### Leistungsübersicht (Akquise)

`KONFIG` in `scripts/build_leistungsuebersicht.py`: `BETRIEB` und
`ANSPRECHPARTNER` leer lassen für die neutrale Fassung, oder füllen
für die personalisierte. Versand als PDF:

```bash
python3 scripts/build_leistungsuebersicht.py /pfad/leistungsuebersicht.pptx
soffice --headless --convert-to pdf --outdir /pfad /pfad/leistungsuebersicht.pptx
```

Der Themenkatalog (KI-Tools, Schulung, Technik-Infrastruktur,
Vertragsprüfung, Angebotsautomatisierung, Website-Optimierung,
Website-Erstellung, „Und mehr“) steht als `THEMEN`-Liste im Skript.

## Rote Linien

- Fachlich fixe Zahlen (1.900 € netto; ab 10.000 €, typisch 15.000 €;
  Digitalbonus 50 % / 7.500 € / 4.000 €) niemals ändern oder erfinden.
- Keine Gedankenstriche. Versalien-Headlines mit genau einem
  Akzentwort und Schlusspunkt. de-DE-Zahlenformat.
- Keine erfundenen Referenzen, Kundennamen oder Erfolgsquoten.
- Auf hellem Grund immer `STAHL_TIEF` als Akzent-Textfarbe (Kontrast),
  nie das helle `STAHL`.

## Verzeichnisstruktur

```
mfd-ci/
├── SKILL.md
├── references/
│   └── ci.md                          — CI, Sprache, Fixpunkte, Stammdaten
├── scripts/
│   ├── mfd.py                         — Builder-Bibliothek (hell/dunkel)
│   ├── build_master.py                — Folienmaster (16 Layouts)
│   ├── build_leistungsuebersicht.py   — Akquise-Anhang (PPTX/PDF)
│   └── build_angebot_docx.js          — verbindliches Angebot (Word)
└── assets/
    ├── mfd_master.pptx                — gebauter Folienmaster
    ├── oliver-portraet.jpg            — Porträt (rund einsetzen)
    ├── k1-nachmittag.jpg              — Cover hell (Halle, Nachmittag)
    ├── k4-buero-nacht.jpg             — Cover dunkel (Glasbüro, Nacht)
    └── fonts/                         — Space Grotesk TTF (Reg/Med/Bold)
```
