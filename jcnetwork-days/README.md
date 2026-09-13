# JCNetwork Days 2026 — RACI-Planungsboard

Die RACI-Excel der JCNetwork Days als Planungsoberfläche für das Projektteam.

```
index.html            komplette App (CSS und JS inline, nur data.js daneben)
data.js               532 Aufgaben aus der Excel — erzeugt, nicht von Hand pflegen
tools/extract_raci.py erzeugt data.js aus der RACI-Excel
```

Excel neu eingelesen:

    python3 tools/extract_raci.py <RACI.xlsx>

## Wie die Excel übersetzt wird

Die Excel hat pro Bereich ein Tabellenblatt, pro Zeile eine Aufgabe und pro
Spalte eine **Position** (VV, CR, F&R, EM, HR, IM, MK, WB, PL, PT, VerV, MV,
Alumni). Drei Dinge kommen in der Oberfläche dazu:

- **Position × Bereich.** Die Excel kennt nur Positionen, der Screenshot des
  Projektteams nur Menschen. Eine Aufgabe landet auf einem persönlichen Board,
  wenn die Position der Person in der Zeile steht *und* der Bereich zu ihr
  gehört. Ohne diese zweite Bedingung bekäme die Projektleitung alle 277
  PL-Zeilen auf einmal.
- **Nur A und R sind Arbeit.** C, I und S stehen getrennt unter „Nur zur
  Kenntnis". Die Buchstaben selbst tauchen nur noch in der Matrix auf —
  überall sonst steht Klartext („Du machst das", „Verantwortlich").
- **Zeitcodes werden zu Daten.** `3m` → 03.09.2026, `2w` → 19.11.2026,
  `Mo` → 30.11.2026 (Vorbereitungswoche), `Sa` → 05.12.2026, `+1m` →
  06.01.2027. Gerechnet vom 3. Dezember 2026. Die Excel-Spalten heißen „Max"
  und „Min"; hier stehen sie als **Fenster ab** und **Deadline**.

`Wahl` und `AnmS` sind keine festen Abstände, sondern Meilensteine. Beide sind
unter „Team" einstellbar, Vorgabe 06.12.2025 und 01.10.2026.

Klammercodes der Excel (`(R)`, `(S)`) heißen „nur falls zutreffend" und werden
blasser dargestellt.

## Geteilter Stand

Status, Flags, Notizen und ergänzte Aufgaben liegen in der `db`-Capability des
Artifacts — alle im Team sehen dieselben Daten. Ohne db (z. B. `index.html`
lokal geöffnet) läuft alles weiter, der Stand bleibt dann im localStorage
dieses Browsers. Die Fußzeile links sagt, welcher Fall gerade gilt.

Der Status hängt an der Aufgabe, nicht an der Person: jede RACI-Zeile hat genau
eine verantwortliche Position (A).

## Offene Punkte

- **Namen des JCNetwork-Vorstands** fehlen (VV, CR, F&R, EM, HR, IM, MK, WB)
  sowie Vereinsvorstand und Alumni-Vorstand. Solange dort „N. N." steht, sind
  die Aufgaben nur über Bereichsansicht, Matrix und Aufgabendetail erreichbar.
- **Bereichsaufteilung der Projektleitung**: Oliver (Wahl & Orga, Personal,
  Verpflegung, Finanzen, Alumni), Antonia (Unterkünfte & Check-In, Logistik,
  Workshops), Noah (Plenen/Messe & MV, Partys, Kommunikation, Unternehmen).
  Jeder Bereich gehört genau einer Person. Unter „Team" änderbar.
- **Anmeldung als Person**, nicht als Login — jede Person wählt sich selbst
  aus. Wer etwas ändert, wird protokolliert, aber nicht geprüft.

## Betrieb: Personal, Logistik, Räume

Die RACI endet bewusst vor der Veranstaltung — im Anleitungsblatt steht:
„Explizit nicht in der RACI aufgeführt sind alle Aufgaben, die während der
Durchführung erledigt werden müssen." Diese drei Module sind genau diese
fehlende Hälfte.

```
ops.js                 Materialkatalog, Standardpakete, Einsatzbereiche, Bedarfsvorlage
tools/extract_ops.py   erzeugt ops.js aus den Alt-Listen früherer Days
```

Übernommen wurde **nicht** der ausgefüllte Stand von Karlsruhe, Mainz und
Stuttgart, sondern das Regelwerk dahinter.

### Personal — aus dem Stuttgarter Personalplan

Der Kern des Stuttgarter Plans ist eine einzige Gegenüberstellung: **Bedarf**
je Einsatzbereich und Halbstundenfenster gegen die tatsächlich eingeteilten
**Schichten**. Das Blatt „Gesamtplan" ist Person × Zeitfenster → Einsatzbereich,
die Blätter „Bedarfsplan Do/Fr/Sa/So" sind Einsatzbereich × Zeitfenster → Anzahl.

Daraus wird das Abdeckungsraster. Aufeinanderfolgende unterbesetzte Fenster
fasst die App zu einer Lücke zusammen („Lager, 14:00–17:30, 2 fehlen"), statt
sie einzeln aufzulisten. Ein Veranstaltungstag läuft von 06:00 bis in die
Nacht — 01:00 gehört zum Vortag, nicht an den Listenanfang.

Die 18 Einsatzbereiche und der Bedarfsverlauf stammen aus Stuttgart und sind
als Vorlage gekennzeichnet; „Bedarf ändern" skaliert den Tagesverlauf eines
Bereichs auf einen neuen Spitzenwert.

### Logistik — aus der Mainzer Bedarfsplanung

Die Mainzer Liste ist ein Materialfluss. Jeder Posten steht an einer
**Station** (Tag + Ort + Programmpunkt) und hat eine Herkunft; die Spalte
„Verkettung" ist der Schlüssel, „Kommt von…" die Kante. Die Spalte
Gebrauch/Verbrauch entscheidet, ob etwas zurück muss — daraus wird die
Ansicht „Rückführung".

Die Karlsruher Liste ergänzt den Packstatus (X = da, O = fehlt) als
Statusknopf je Posten.

### Räume — aus den Packlisten nach Locations

Ein Raum hat eine Ausstattung, ein Workshop einen Bedarf. Die Differenz ist
exakt das, was die Logistik hinbringen muss — deshalb erzeugt „Anfordern"
direkt Logistikposten.

### Standardpakete: die Regeln statt der Ergebnisse

Die Spalte „Besonderheiten" der Karlsruher Liste ist ein Regelsatz —
„1 pro Raum", „2 je Workshop", „1 pro Flipchart", „Für Gesamtlocation".
`paketePlan()` rechnet daraus eine Packliste, statt sie abzutippen: aus
Räumen und Workshops je Location entstehen die Posten automatisch.

## Claude — über die eigene App, nicht aus der Seite

Die Seite ruft **kein** Claude auf. Niemand soll dafür zahlen, dass er das
Board öffnet. Stattdessen zwei Exporte unter „Team":

- **Planstand als Markdown** — Aufgaben, Lücken, Helfende, Logistik, Räume in
  einer Datei. In der eigenen Claude-App anhängen und fragen.
- **Plan-Liste als CSV** — im Format des Blatts „Plan Liste" der offiziellen
  Personalplan-Vorlage: `Aufgaben ID; Helfer ID; Vorname; Nachname; Account;
  Aufgabe; Datum; Beginn; Ende`. Geht damit zurück nach Excel.

Der MCP-Server `Planungstool_Personal` wäre der direktere Weg, antwortete in
der Bauumgebung aber nicht. Ohne eine einmal beobachtete echte Antwort wird
die `mcp`-Capability nicht verdrahtet — sonst steht geratenes Datenformat in
der veröffentlichten Seite.


## Rollen

Helfende melden sich wie alle anderen über „Wer bist du?" an und sehen dann
nur ihre eigenen Schichten mit Zeiten, Einsatzbereich und Beschreibung —
keine RACI, keine Planungsansichten.

## Offene Punkte (Betrieb)

- **Bedarfsverlauf** ist Stuttgart 2024. Für Würzburg anpassen.
- **Einsatzbereiche** ebenso — Ort und Ansprechperson fehlen noch.
- **Beispieldaten** gibt es nur noch bei den Helfenden (drei Personen, als
  solche markiert). Räume und Workshops starten leer.
- **Fahrten** aus der Mainzer Liste (Fahrten-ID, Hin-/Rückfahrt) sind noch
  nicht abgebildet — bisher nur Station und Herkunft je Posten.

## Die offizielle Personalplan-Vorlage

Die Vorlage (Blatt „Erläuterung") ist die kanonische Quelle und liefert drei
Dinge, die der ausgefüllte Stuttgarter Plan nicht hergab:

- **Aufgabenbeschreibungen**: `Kürzel | Aufgabe | Beschreibung | Ort |
  Ansprechperson | Tel.` — Ansprechperson und Telefon stehen jetzt auf der
  Schicht jeder helfenden Person. Das ist der eigentliche Zweck.
- **Verfügbarkeit**: die Vorlage färbt Zellen als „Nicht verfügbar". Als
  Abwesenheiten übernommen, damit niemand in eine Absage eingeplant wird.
- **Plan Liste** als Austauschformat — siehe CSV-Export oben.

Die Vorlage selbst kennt keinen Soll-Bedarf; sie zählt nur, wer eingeteilt
ist. Die Bedarfsplanung hat Stuttgart ergänzt. Das Tool führt beides.

**Ein bewusster Unterschied:** die Vorlage legt jeden Tag von 00:00 bis 23:30
an, Stuttgart und dieses Tool rechnen einen Veranstaltungstag von 06:00 bis
05:30 am Folgetag — sonst landet die Schicht auf der Freitagsparty um 01:00
im Samstag. Beim Abgleich mit der Vorlage daran denken.

## Farben

Die Kategoriefarben sind gegen den Validator der `dataviz`-Skill geprüft
(sieben Slots plus Neutral für „Sonstiges", hell und dunkel, Farbfehlsichtigkeit
und Kontrast). Sie sind bewusst getrennt von der Akzentfarbe (C&C-Blau, nur
Bedienelemente) und den Statusfarben (überfällig, bald, erledigt). Dieselbe
Kategorie hat überall dieselbe Farbe — im Balken, an der Posten-Kante, im
Eingabedialog.

## Selbst hosten

Die App ist statisches HTML mit ein paar JavaScript-Dateien — kein Build, kein
Server. Sie läuft auf jedem Webspace, der Dateien ausliefert. Der einzige
Unterschied zwischen den Betriebsarten ist, **wo der geteilte Stand liegt**;
`store.js` entscheidet das beim Start:

| Betriebsart | Geteilter Stand | Wer kommt rein |
|---|---|---|
| Claude-Artifact | `db`-Capability, nichts einzurichten | nur angemeldete Mitglieder der Organisation |
| Selbst gehostet + Supabase | Supabase, Abgleich alle 8 Sekunden | jede Person mit dem Link |
| Selbst gehostet ohne Supabase | nur der eigene Browser | jede Person mit dem Link, aber ohne gemeinsamen Stand |

Die Fußzeile links unten sagt immer, welcher Fall gerade gilt.

### Schritt 1 — Dateien ausliefern

Alles unter `jcnetwork-days/` hochladen: `index.html`, `app.js`, `store.js`,
`config.js`, `data.js`, `ops.js`. Fertig.

Für GitHub Pages liegt ein Workflow bereit (`.github/workflows/pages.yml`):
unter *Settings → Pages → Source: GitHub Actions* einschalten, dann
veröffentlicht jeder Push die aktuelle Fassung.

### Schritt 2 — Gemeinsamen Stand einrichten

Ohne diesen Schritt sieht jede Person nur ihre eigenen Eingaben.

1. Kostenloses Projekt auf supabase.com anlegen.
2. Im SQL Editor `supabase-schema.sql` ausführen.
3. Aus *Project Settings → API* die Projekt-URL und den `anon`-Key in
   `config.js` eintragen.

### Schritt 3 — Zugriff beschränken

**Das ist keine Kür.** Im Board stehen Telefonnummern von Helfenden. Der
anon-Key steht im ausgelieferten JavaScript und ist für jede Person lesbar,
die die Seite öffnet — wer den Link hat, kann also alles lesen und ändern.
Eine öffentlich erreichbare Seite wäre damit eine Datenpanne.

Zwei praktikable Wege:

- **Cloudflare Pages + Cloudflare Access** — kostenlos bis 50 Personen,
  Anmeldung per E-Mail-Code. Für ein Projektteam plus Helfende der passende
  Zuschnitt und der Weg, den wir empfehlen.
- **Privates Repository + GitHub Pages** — Pages ist für private
  Repositories Teil der kostenpflichtigen Pläne.

Wer keinen Zugriffsschutz einrichten kann: die Seite ohne Supabase betreiben
und die Telefonnummern leer lassen. Dann ist sie ein Nachschlagewerk für die
Planung, kein gemeinsames Werkzeug.

### Was ohne Claude-Konto fehlt

Nichts. Die Exporte laufen selbst gehostet über einen normalen Browser-Download;
im Artifact über dessen `downloads`-Capability, weil dort ein gewöhnlicher
Download-Link gesperrt ist. Die Funktion `download()` in `app.js` probiert beide
Wege in dieser Reihenfolge.

### Render

Für Render liegt ein Blueprint im Wurzelverzeichnis (`render.yaml`): auf
render.com „New → Blueprint", dieses Repository wählen. Render legt beides an —
die Static Site mit dem Board und den MCP-Server als Web Service — und fragt
`SUPABASE_URL` und `SUPABASE_KEY` ab. Den `MCP_TOKEN` würfelt Render selbst aus.

Render-Static-Sites sind öffentlich. Der Passwortschutz steht in den
Einstellungen der Site; sonst gilt der Abschnitt „Zugriff beschränken" oben.

## Startseite und Rollen

Das Board ist die Startseite für alle: Begrüßung, Projektphase, dann sechs
Kacheln, von denen aus jede Person in ihren Teil abbiegt. Wer im Vorstand,
bei den Fellows oder in einem Gremium steht, bekommt statt „Meine Aufgaben"
die Kachel **Meine Rolle** — die RACI-Sicht auf die eigene Position, sortiert
nach verantworten, ausführen, gefragt werden, informiert werden,
unterschreiben.

## In Arbeit

Status und Notiz hängen an der Aufgabe, nicht an der Person. Die Ansicht
**In Arbeit** sammelt alles, was auf „Läuft" oder „Hängt" steht, geflaggt ist
oder eine Notiz trägt. Notizen stehen auch direkt in der Aufgabenzeile — wer
die Liste überfliegt, sieht den Stand ohne Klick.

## Raum-Checkliste

Jede Raumkarte rechnet ihre Aufbau-Checkliste aus denselben Regeln wie die
Packliste: was dem Raum gegenüber dem Workshop-Bedarf fehlt, die Standardposten
je Raum und je Workshop, Flipchartpapier je Flipchart, Pinnadeln bei
Stellwandbedarf. Abgehakt wird pro Raum, sichtbar für alle.

## Logistik-Notizen

Ein schlichter Nachrichtenstrom unter „Notizen" für alles, was keine Aufgabe
ist — „Sprinter steht hinterm Z6", „Kaffeemaschine kaputt". Eigene Nachrichten
lassen sich löschen.

## Farben

Kategoriefarben und Bereichsfarben kommen aus derselben geprüften Reihe
(sieben Slots). Zwölf Bereiche auf sieben Farben heißt Wiederholung — deshalb
steht der Name immer daneben und die Farbe trägt nie allein die Bedeutung.

## MCP-Server: Claude in der eigenen App

`mcp/` enthält einen MCP-Server, der denselben Planstand liest wie das Board.
Jede Person hängt ihn in **ihrer eigenen** Claude-App als Connector ein — die
Nutzung geht damit über das jeweils eigene Abo, und das Board selbst ruft
weiterhin nichts auf.

Er ist **nur lesend**. Geändert wird im Board.

### Werkzeuge

| Werkzeug | Beantwortet |
|---|---|
| `projekt_ueberblick` | Countdown, offene und überfällige Aufgaben je Bereich, Personallücken, Logistik |
| `aufgaben_offen` | offene RACI-Aufgaben, nach Bereich, Person oder Dringlichkeit |
| `bereich_status` | Soll gegen Ist je Einsatzbereich und Tag |
| `luecken_finden` | unterbesetzte Zeitfenster, zusammenhängend gefasst |
| `helfer_schichten` | alle Schichten einer Person |
| `helfende_suchen` | nach Führerschein, Erste Hilfe, Sprinter, ohne Schicht |
| `material_status` | Logistikposten je Station, mit Herkunft und Packstatus |
| `raum_status` | Räume, Ausstattung, Workshops und was fehlt |

Die Namen folgen bewusst dem Vokabular, das der bestehende Server
`Planungstool_Personal` benutzt.

### Einhängen

Nach dem Deploy steht in Render unter *Environment* der erzeugte `MCP_TOKEN`.
Die Connector-URL ist dann:

    https://<dienstname>.onrender.com/mcp/<token>

In der Claude-App unter *Einstellungen → Connectors → Connector hinzufügen*
diese URL eintragen. Ohne oder mit falschem Token antwortet der Endpunkt mit
404 — der Token ist der ganze Zugangsschutz, also behandelt ihn wie ein
Passwort und teilt ihn nur im Team.

### Lokal ausprobieren

    cd jcnetwork-days/mcp
    npm install
    MCP_TOKEN=test SUPABASE_URL=... SUPABASE_KEY=... npm start

Ohne Supabase-Werte startet er trotzdem und liefert die RACI aus `data.js` —
nur eben ohne Status, Schichten und Material.

### Grenzen

- Der Render-Free-Plan schläft nach Leerlauf ein; der erste Aufruf danach
  braucht eine halbe Minute.
- Der Server hält keine Sitzung (staatenlos), damit mehrere Personen
  gleichzeitig fragen können, ohne dass Render klebrige Sitzungen braucht.
- Supabase-Antworten werden fünf Sekunden zwischengespeichert.
