# Riva Sei — Website

Statische One-Page-Website für das Ristorante Riva Sei, Rheinufer 6, 56179 Vallendar.

```
index.html                  komplette Seite (CSS und JS inline, keine Abhängigkeiten)
assets/terrasse-rhein.jpg   Terrasse mit Blick nach Niederwerth (Bühnenbild)
assets/haus-riva-sei.jpg    Haus und Aufgang zur Terrasse
build-artifact.py           erzeugt eine Einzeldatei mit eingebetteten Bildern
```

Öffnen: `index.html` im Browser, oder `npx http-server .` im Projektordner.

## Gestaltung

Dunkel als Grundstimmung (Dämmerung am Fluss), hell als Mittagsvariante — beide
Themes laufen über dieselben CSS-Custom-Properties und folgen der Systemeinstellung.
Anzeigenschrift Palatino/Iowan Old Style, Fließtext Optima/Candara: zwei Schnitte
von Hermann Zapf, beide aus der italienischen Renaissance-Antiqua entwickelt.
Akzentfarbe ist das Bernstein der Terrassenlaternen.

Keine externen Schriften, Skripte oder Bilder — die Seite läuft vollständig offline.

## Herkunft der Inhalte

- **Fließtexte** (Begrüßung, „Unsere Geschichte") wörtlich von riva-sei.de,
  entnommen aus dem PDF-Export der Startseite.
- **Fotos** aus demselben PDF-Export.
- **Gästestimmen** aus öffentlichen Google-Rezensionen. Zwei Rezensionen waren
  in der Vorlage abgeschnitten („… Mehr") und enden entsprechend am letzten
  vollständigen Satz.
- **Öffnungszeiten, Telefon, E-Mail, Google-Bewertung 4,4** aus Websuche
  (Stand August 2026) — riva-sei.de war aus der Build-Umgebung nicht erreichbar.

## Offene Punkte

- **Öffnungszeiten und Kontaktdaten** gegen den aktuellen Stand des Restaurants
  prüfen — sie stammen aus Suchergebnissen, nicht von der Website selbst.
- **Bildergalerie**: Die Seite hat noch keinen Galerie-Abschnitt. Sobald die
  Fotos als Dateien vorliegen, kommen sie nach `assets/galerie/`.
- **Impressum und Datenschutz** im Fuß zeigen auf `riva-sei.de` — hier fehlen
  die echten Ziel-URLs.
- **Speisekarte**: Die Karte zeigt Kategorien ohne Preise und verweist auf
  riva-sei.de/speisekarte. Für eine vollständige Karte mit Preisen wird die
  aktuelle Speisekarte benötigt.
