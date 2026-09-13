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

## Claude im Tool

Die Seite darf über die `sample`-Capability Fragen an Claude stellen —
„Wo ist die größte Lücke?", „Wer hat Führerschein und ist Donnerstag frei?".
Als Kontext geht der aktuelle Planstand mit (Bedarf, Schichten, Lücken,
Material, Räume).

**Nicht angebunden** ist der MCP-Server `Planungstool_Personal`. Er wäre der
richtige Weg, um auf eine bestehende Helferdatenbank zu lesen, antwortete in
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
- **Beispieldaten** (3 Helfende, 2 Räume, 2 Workshops) verschwinden, sobald
  echte Daten angelegt sind.
- **Fahrten** aus der Mainzer Liste (Fahrten-ID, Hin-/Rückfahrt) sind noch
  nicht abgebildet — bisher nur Station und Herkunft je Posten.
