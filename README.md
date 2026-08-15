# Mainfranken Digital — Landingpage

Statische One-Page-Landingpage (HTML, CSS, Vanilla JS, kein Framework) für
Mainfranken Digital: eine Ein-Personen-Beratung, die Handwerksbetrieben in
Bayern Büroabläufe mit KI und Automatisierung abnimmt.

```
index.html                        komplette Seite (CSS und JS inline)
assets/fonts/                     Literata + IBM Plex Sans, lokal (keine externen Anfragen)
build-artifact.py                 erzeugt eine Einzeldatei mit eingebetteten Schriften
kontrast-check.py                 prüft die Licht-Rampen auf WCAG-Kontrast (≥ 4,5:1)
.claude/skills/                   Design-Skills (frontend-design, ui-ux-pro-max)
```

Öffnen: `index.html` im Browser, oder `npx http-server .` im Projektordner.

## Das Konzept: Feierabendlicht

Die Seite erzählt ihre Botschaft über Licht, nicht über Bilder. Sie beginnt in
tiefem Abendblau (abends um acht brennt im Büro noch Licht) und wandelt sich
beim Scrollen stufenlos über Dämmerung und Morgenrot zu warmem Tageslicht — bei
Kontakt und Abschluss passiert die Arbeit wieder am Tag.

- Der Verlauf hängt ausschließlich an der Scrollposition (Interpolation, kein
  Timer). Text-, Linien- und Akzentfarben interpolieren mit.
- Die Rampen sind so kalibriert, dass es keinen Scrollzustand mit schlecht
  lesbarem Text gibt: heller Text läuft zur Umschaltschwelle hin auf reines
  Weiß, dunkler Text beginnt dort bei Schwarz und läuft zur Tinte.
  Numerischer Nachweis: `python3 kontrast-check.py` (schlechtester Wert 4,51:1).
- `prefers-reduced-motion` (und Betrieb ohne JavaScript) bekommt statische
  Abschnittsfarben aus derselben Dramaturgie statt des Verlaufs.

Farben: Nacht `#101B2E` · Dämmerung `#3A4A6B` · Morgen `#C9885A` · Tag `#F2EFE8`
· Lichtwarm `#E8A34D` · Tinte `#1C2733`. Schrift: Literata (ruhige Serif,
variabel) für Headlines, IBM Plex Sans (stille Grotesk) für alles andere —
beide als Variable Fonts lokal eingebettet (SIL OFL).

Im Hero gibt es kein Foto und keine Illustration: nur ein warm erleuchtetes
Bürofenster aus Licht und Typografie.

## Förderrechner (fachlich fix)

- Eingabe Projektvolumen 4.000–60.000 €, Standard 15.000 €
- `zuschuss = min(volumen × 0,5, 7500)` — die Deckelung ist Pflicht
- `eigenanteil = volumen − zuschuss`
- Unter 4.000 € keine Förderung (Mindestgrenze des Programms); der Regler
  beginnt deshalb bei 4.000 €.

## Platzhalter

Es ist nichts erfunden: keine Kundennamen, Referenzen, Erfahrungsjahre,
Erfolgsquoten, Testimonials. Vor Veröffentlichung ersetzen (Suche nach
`PLATZHALTER` in `index.html`):

- **Telefonnummer** — Header, Hero, Kontakt, Footer; danach als `tel:`-Links
  verdrahten (derzeit verweist der Header-Eintrag auf die Kontaktsektion)
- **E-Mail-Adresse** — Kontaktsektion, Footer und die Konstante `EMAIL` im
  Skript (solange der Platzhalter drinsteht, verweist das Formular ehrlich
  aufs Telefon)
- **Förderprogramm** — Name und Link (zweimal in der Fördersektion)
- **Erreichbarkeit, Ort** — Kontaktsektion
- **Impressum, Datenschutz** — Footer-Links und Hinweise in FAQ/Formular

Die endgültigen deutschen Texte werden separat geliefert und wörtlich
übernommen; die aktuellen Texte sind Entwurfsfassungen in der Zielsprache.

## Einzeldatei-Fassung

```
python3 build-artifact.py        -> dist/mainfranken-digital.html
```

Bettet die drei Schriftdateien als Data-URIs ein — eine Datei, läuft überall
offline.
