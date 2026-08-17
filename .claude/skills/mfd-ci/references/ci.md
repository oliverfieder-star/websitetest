# Mainfranken Digital — CI-Referenz („Werkfilm“-Designsprache)

Die CI stammt von der Website (Scroll-Film durch eine Handwerkshalle,
Nachmittag bis Nacht). Grundhaltung: ruhig, konkret, handwerklich
präzise. Kein Schmuck ohne Funktion.

## Farbwelt

| Token | Hex | Verwendung |
|---|---|---|
| Nacht (Graphit) | `#0D0F12` | Seiten-/Foliengrund, Text auf Stahl |
| Fläche | `#14171C` | Karten |
| Fläche 2 | `#1B1F26` | abgesetzte Flächen, Eingabefelder |
| Silber | `#E9E7E2` | Primärtext, Headlines |
| Nebel | `#A8AEB6` | Fließtext |
| Gedimmt | `#9AA0A8` | Nebentext, Fußzeilen |
| Stahl | `#8FA9BD` | Akzent: je Headline genau EIN Wortteil, Zahlen, CTA-Flächen, Kicker |
| Stahl hell | `#A7C0D2` | Hover/Steigerung (Web) |
| Linie | `#2B2F36` | feine Rahmen und Trennlinien (Ersatz für 12 % Weiß) |

Heller Beratungs-Modus (Tageslicht-Fassung derselben Welt):

| Token | Hex | Verwendung |
|---|---|---|
| Papier | `#F4F3F0` | Seitengrund hell |
| Karte hell | `#FCFBF9` | Karten hell |
| Graphit | `#14171C` | Primärtext hell |
| Schiefer | `#4A5058` | Fließtext hell |
| Grau hell | `#7A8088` | Nebentext hell |
| Stahl tief | `#4F6E88` | Akzent-Text/CTA auf hellem Grund |
| Linie hell | `#D9D7D2` | feine Linien hell |

Deck-Rhythmus: dunkles Cover → helle Inhaltsfolien → dunkle Zitat-
und Kontaktfolien. Dokumente (Word/PDF) laufen komplett hell.

Regeln: Stahl ist Würze, nicht Grundfarbe. Nie mehr als ein Akzentwort
pro Headline. Keine Verläufe außer Bild-Abdunkelung. Kein reines
Schwarz, kein reines Weiß. Auf hellem Grund nie das helle `#8FA9BD`
als Textfarbe (zu wenig Kontrast), sondern `#4F6E88`.

## Typografie

- **Display/Text:** Space Grotesk (Headlines fett + VERSALIEN, mit
  Schlusspunkt: „VIER SCHRITTE.“). Fließtext normal, 1,25-facher
  Zeilenabstand, längere Absätze im Blocksatz.
- **Zeichensprache/Mono:** Consolas (bzw. ui-monospace): Kicker,
  Etiketten, Schrittnummern (01, 02 …), Fußzeilen. Immer VERSALIEN
  mit weiter Sperrung (2-3 pt).
- Schriftdateien liegen in `assets/fonts/` (Space Grotesk Regular /
  Medium / Bold als TTF). Auf Rechnern ohne installierte Schrift fällt
  PowerPoint auf eine Systemschrift zurück; für 1:1-Darstellung die
  TTFs installieren oder in PowerPoint „Schriftarten einbetten“
  aktivieren.

## Wiederkehrende Elemente

- **Maßketten-Trenner:** Linie mit kurzen Endstrichen, mittig ein
  Mono-Label (Sektionsname). Ersetzt Zwischenüberschriften.
- **Karten:** Fläche `#14171C`, 1 pt Linie `#2B2F36`, leichte Rundung.
  Betonte Karte: Stahl-Rand.
- **Pillen:** Mono-Etikett mit Stahl-Rahmen („SCHRITT 1“).
- **CTA:** Stahl-Fläche, Tinte-Text, Versalien, gesperrt.
- **Kennzahlen:** große Display-Zahl, darunter Mono-Label.
- **Porträt:** rund, 1,5 pt Stahl-Rand (`assets/oliver-portraet.jpg`).
- **Coverbilder:** Hallen-Keyframes (`assets/k1-nachmittag.jpg` hell,
  `assets/k4-buero-nacht.jpg` Nacht) mit 60-80 % Graphit-Schleier.

## Sprache

- Deutsch, Sie-Form, ruhig und konkret. Keine Superlative, keine
  Buzzwords, keine Floskeln.
- **Keine Gedankenstriche** (wirken KI-generiert). Punkte, Kommas,
  Doppelpunkte.
- Zahlen im de-DE-Format: „1.900 €“, „50 %“ (geschütztes Leerzeichen).
- Offenes/Unbekanntes als `[PLATZHALTER]` markieren, nie erfinden.

## Fachlich fix (nie ändern, nichts erfinden)

- Digital-Check / Status-quo-Analyse: **1.900 € netto**, ein Tag vor
  Ort, schriftlicher Bericht + Ergebnisgespräch.
- Umsetzungsprojekt: **ab 10.000 €**, typisch 15.000 €, mit Förderung
  effektiv 7.500 €.
- Digitalbonus Bayern: **50 %** Zuschuss, gedeckelt **7.500 €**,
  Mindestvolumen **4.000 €**; Rechnung:
  `zuschuss = min(volumen × 0,5; 7500)`, `eigenanteil = volumen − zuschuss`.
  Immer mit Hinweis „Angaben ohne Gewähr; maßgeblich digitalbonus.bayern.de“.
- Keine Kundennamen, Referenzen, Erfolgsquoten oder Testimonials
  erfinden. Belegt und nutzbar: „Selbstständig seit dem 15. Lebensjahr,
  über sechs Jahre Unternehmer, seit rund drei Jahren in der Beratung,
  in Projekten unter anderem mit Kunden wie Siemens.“

## Stammdaten

Fieder Handels GmbH · Versbacher Straße 20 · 97078 Würzburg ·
Amtsgericht Würzburg, HRB 17397 · Geschäftsführer: Oliver Fieder ·
USt-ID DE3370133371 · Telefon 0179 213 74 76 ·
oliver@mainfranken-digital.de ·
Calendly: https://calendly.com/oliver2004-fieder/30min ·
„Mainfranken Digital“ ist ein Angebot der Fieder Handels GmbH.
