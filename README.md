# Mainfranken Digital — Website

Statische Landingpage für eine Ein-Personen-Beratung, die bayerischen
Handwerksbetrieben KI und Prozessautomatisierung einführt.

```
index.html              die Seite
style.css               Gestaltung, alle Farben und Abstände als Custom Properties
main.js                 Bildübergang, Förderrechner, Einblenden, Formular
impressum.html          Platzhalter
datenschutz.html        Platzhalter
assets/                 die beiden Schreibtisch-Fotos
bilder-aufbereiten.py   erzeugt WebP und drückt die JPGs unter 300 kB
einzeldatei.py          baut alles zu einer einzigen HTML-Datei zusammen
```

Kein Framework, kein Build-Step, keine externen Abhängigkeiten. Der Ordner
lässt sich unverändert auf jeden Hoster legen.

Ansehen: `python3 -m http.server 8000` im Projektordner, dann
`http://localhost:8000`. (Direkt per Doppelklick geht auch, dann greifen
allerdings die relativen Pfade je nach Browser nicht überall.)

## Einzeldatei zum Verschicken

```
python3 einzeldatei.py     ->  dist/mainfranken-digital.html
```

Legt CSS und JavaScript inline und die beiden Fotos als `data:`-URI ins
Markup. Das Ergebnis lädt nichts nach, läuft offline und per Doppelklick.
Fehlt ein Foto in `assets/`, kommt an seine Stelle ein sichtbar markierter
Platzhalter und das Skript sagt es beim Bauen an — nach dem Hinlegen der
Dateien einfach noch einmal laufen lassen. Ohne Fotos wiegt die Datei rund
60 kB, mit zwei komprimierten Fotos etwa 450 kB.

Die Verweise auf `impressum.html` und `datenschutz.html` bleiben relativ;
die beiden Seiten stecken nicht mit in der Einzeldatei.

## Der Bildübergang

Die Sektion zwischen „Das Problem" und „Der Digital-Check" läuft in drei
Fassungen, die `main.js` beim Laden und bei jeder Größenänderung neu wählt:

| Fassung      | wann                                        | was passiert |
|--------------|---------------------------------------------|--------------|
| `kino`       | ab 62rem Breite und 34rem Höhe              | Sticky-Container über 220vh, Crossfade linear mit dem Scroll |
| `gestapelt`  | schmalere Fenster                           | beide Bilder untereinander, per IntersectionObserver eingeblendet |
| `ruhig`      | `prefers-reduced-motion: reduce`            | nur Bild 2, beide Beschriftungen als Text darunter |

Ohne JavaScript bleibt es bei `gestapelt` — das ist der Grundzustand im CSS.

Der Fortschritt im Sticky-Container steuert: 0–30 % nur Bild 1, 30–70 %
Crossfade plus Scale 1.0 → 1.02 auf beiden Ebenen, ab 70 % nur Bild 2.
Rückwärtsscrollen kehrt das um, es gibt keinen Timer.

## Der Förderrechner

```js
const zuschuss    = Math.min(volumen * 0.5, 7500);
const eigenanteil = volumen - zuschuss;
```

Die Deckelung bei 7.500 € ist fest verdrahtet. Unterhalb von 4.000 €
Projektvolumen — erreichbar nur über das Eingabefeld, der Regler beginnt bei
4.000 — steht der Zuschuss auf 0, weil das Programm dort nicht fördert; die
Meldung sagt dasselbe. Ohne diese Ausnahme würde der Rechner für 2.000 €
Volumen 1.000 € Zuschuss anzeigen und der eigenen Meldung widersprechen.

## Gestaltung

Tiefblauer Grund, dünne helle Linien, ein feines Raster als fester Hintergrund.
Ein einziger warmer Akzent in Kupfer für Knöpfe, aktive Zustände und
Schlüsselzahlen. Die Fotos sind die einzigen warmen Flächen der Seite.

```
--blaupause     #0E2A47    Grundfläche
--nachtblau     #08192B    abgesetzte Sektionen, Kopf, Fuß
--kreide        #EDF2F7    Text
--werkstattgrau #7C8A99    Kleingedrucktes, Marken, Platzhalter
--kupfer        #C8763C    Akzent
```

Dazu drei abgeleitete Helligkeitswerte (`--kreide-leise`, `--kupfer-hell`,
`--linie`), damit auch Fließtext zweiter Ordnung und Kupfer auf Blau die
Kontrastwerte der WCAG-Stufe AA erreichen. Keine Verläufe, keine Schatten.

Zahlen laufen durchgehend in Tabellenziffern (`font-variant-numeric:
tabular-nums`).

## Schriften

Die Seite nutzt den Systemschriftstapel — zwei Schnitte (400 und 600), dazu
den Monospace-Stapel des Systems für Blattnummern, Marken und Augenbrauen. So
wird keine einzige Schriftdatei geladen.

Wenn eine Hausschrift dazukommen soll: zwei `.woff2` nach `assets/fonts/`
legen, `@font-face` im Kopf von `style.css` ergänzen und `--satz` umstellen.
Nicht mehr als zwei Schnitte, und selbst gehostet — kein CDN.

## Offene Punkte

- **Beide Schreibtisch-Bilder fehlen noch.** Sie gehören als
  `assets/schreibtisch-vorher.jpg` und `assets/schreibtisch-nachher.jpg` in den
  Ordner. Danach `python3 bilder-aufbereiten.py` laufen lassen — das erzeugt
  die `.webp`-Fassungen, auf die die `<source>`-Zeilen zeigen, und meldet die
  tatsächlichen Bildmaße (`width`/`height` in `index.html` danach abgleichen).
  Fehlt die WebP-Fassung, nimmt `main.js` die `<source>`-Zeile heraus und
  lädt das JPG nach — die Seite funktioniert also auch mit den JPGs allein,
  nur eben mit größeren Dateien.
- **Telefonnummer** steht als `[TELEFONNUMMER]` in der Kontaktsektion, im Fuß
  und im Impressum.
- **Impressum und Datenschutz** sind Gerüste mit markierten Platzhaltern.
  Anschrift, Rechtsform und Steuerangaben fehlen, der Text ist nicht geprüft.
- **Kontaktformular** hat keinen Server. Der Knopf packt die fünf Felder in
  eine `mailto:`-Nachricht; darunter steht ein als solcher markierter
  Platzhalterhinweis. Sobald ein Endpunkt existiert: `action` und `method` am
  `<form>` setzen und `initFormular()` in `main.js` entfernen.
- **Reste des Vorgängerprojekts** liegen noch im Ordner
  (`build-artifact.py`, `assets/haus-riva-sei.jpg`, `assets/terrasse-rhein.jpg`)
  und gehören gelöscht.
