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
- **Nur A und R sind Arbeit.** C und I stehen getrennt unter „Rücksprache &
  Info". S (Unterschrift) ebenfalls.
- **Zeitcodes werden zu Daten.** `3m` → 03.09.2026, `2w` → 19.11.2026,
  `Mo` → 30.11.2026 (Vorbereitungswoche), `Sa` → 05.12.2026, `+1m` →
  06.01.2027. Gerechnet vom 3. Dezember 2026. Die Excel-Spalten heißen „Max"
  und „Min"; hier stehen sie als **Fenster ab** und **Deadline**.

`Wahl` und `AnmS` sind keine festen Abstände, sondern Meilensteine. Beide sind
unter „Team & Eckdaten" einstellbar, Vorgabe 06.12.2025 und 01.10.2026.

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
  die Aufgaben nur über Bereichsansicht und Matrix erreichbar.
- **Bereichsaufteilung der Projektleitung** ist als 4/4/4 hinterlegt (Oliver:
  Wahl & Orga, Personal, Finanzen, Alumni). Unter „Team & Eckdaten" änderbar.
- **Anmeldung als Person**, nicht als Login — jede Person wählt sich selbst
  aus. Wer etwas ändert, wird protokolliert, aber nicht geprüft.
