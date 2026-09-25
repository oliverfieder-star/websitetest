# Planer

Ein schlichter Kalender, aufgebaut wie Outlook. Er zeigt alle Kalender eines Google-Kontos
und ergänzt sie um Tages- und Wochenziele, Aufgaben mit Uhrzeit und einen Habit-Tracker.

```
index.html   Oberfläche
styles.css   Gestaltung (hell und dunkel, folgt der Systemeinstellung)
app.js       Ansichten, Ziele, Aufgaben, Habits, Drag & Drop
google.js    Google-Anmeldung und Kalender-API
config.js    OAuth-Client-ID (optional, geht auch in den Einstellungen)
```

Kein Build-Schritt, keine Abhängigkeiten, kein eigener Server. Beim ersten Öffnen zeigt der
Planer Beispieldaten. Über den Hinweis oben oder in den Einstellungen lassen sie sich entfernen.

## Starten

```bash
cd planer
python3 -m http.server 8080
```

Dann <http://localhost:8080> öffnen. Die Google-Anmeldung funktioniert nur über `http(s)://`,
nicht beim Öffnen der Datei per Doppelklick.

## Funktionen

**Kalender wie in Outlook**
- Ansichten Tag, Arbeitswoche, Woche und Monat, dazu ein Minikalender und die Kalenderliste links
- Alle Kalender des Google-Kontos, jeweils ein- und ausblendbar
- Termine per Drag & Drop verschieben, an der Unterkante die Dauer ändern, in der Monatsansicht
  auf einen anderen Tag ziehen, in die Zeile „ganztägig“ ziehen, um einen ganztägigen Termin zu machen
- Klick in eine freie Stelle legt einen Eintrag an, Ziehen über mehrere Viertelstunden legt
  gleich die passende Dauer fest
- Neue Termine landen wahlweise in einem Google-Kalender oder lokal im Browser
- Schreibgeschützte Kalender (z. B. abonnierte ICS-Stundenpläne) sind zu sehen, aber gesperrt

**Top 3 für heute und für die Woche**
- Über dem Kalender stehen die drei Tagesziele des ausgewählten Tages und die drei
  Wochenziele der Kalenderwoche
- Abhaken per Klick, Enter springt zum nächsten Ziel
- Im Wochenkopf zeigen drei Punkte je Tag, wie viele Tagesziele erledigt sind

**Aufgaben**
- Rechte Leiste: Aufgabe eintippen, optional mit Uhrzeit und Lebensbereich
- Aufgaben ohne Uhrzeit stehen unter „Ohne Uhrzeit“ und in der Ganztägig-Zeile des Tages
- In den Kalender ziehen gibt ihnen eine Uhrzeit. Danach lassen sie sich wie ein Termin
  verschieben und in der Länge ändern
- Zurück in die Liste ziehen nimmt die Uhrzeit wieder weg. Auf „Irgendwann“ ziehen nimmt das Datum weg
- Überfällige Aufgaben erscheinen oben, solange der heutige Tag ausgewählt ist

**Lebensbereiche**
- Voreingestellt sind Universität, Arbeit, Selbständigkeit, Privates und Sport.
  Die Liste und die Farben sind in den Einstellungen änderbar
- Jeder Google-Kalender bekommt einen Standardbereich. Im einzelnen Termin kannst du den
  Bereich überschreiben, bei Serien gilt das für die ganze Serie
- Links lassen sich Bereiche ausblenden. Daneben stehen die eingeplanten Stunden je Bereich
  im angezeigten Zeitraum

**Habits** (zweiter Bereich in der linken App-Leiste)
- Täglich oder als Wochenziel (z. B. 3× pro Woche)
- Wochenraster zum Abhaken, Serie in Tagen bzw. Wochen, Quote der letzten 30 Tage
- Die Habits des ausgewählten Tages sind auch unten in der Aufgabenleiste abhakbar

**Tastatur**

| Taste | Wirkung |
|---|---|
| `←` `→` | vor und zurück |
| `t` | heute |
| `d` `a` `w` `m` | Tag, Arbeitswoche, Woche, Monat |
| `n` | neuer Eintrag |
| `1` `2` `3` | Kalender, Habits, Einstellungen |

## Google-Kalender verbinden

Einmalig in der Google Cloud Console, etwa zehn Minuten:

1. <https://console.cloud.google.com> öffnen und ein neues Projekt anlegen, z. B. „Planer“.
2. **APIs & Dienste → Bibliothek**: „Google Calendar API“ suchen und aktivieren.
3. **Google Auth Platform** (früher „OAuth-Zustimmungsbildschirm“):
   - App-Name und Support-E-Mail eintragen, Zielgruppe **Extern**.
   - Unter **Zielgruppe → Testnutzer** das eigene Google-Konto eintragen.
     Der Status „Testen“ reicht für den Eigengebrauch, eine Prüfung durch Google ist nicht nötig.
4. **Clients → Client erstellen**, Typ **Webanwendung**:
   - Unter **Autorisierte JavaScript-Quellen** die Adresse eintragen, unter der der Planer läuft,
     z. B. `http://localhost:8080` und später die GitHub-Pages-Adresse.
   - Weiterleitungs-URIs werden nicht gebraucht.
5. Die angezeigte Client-ID (`…apps.googleusercontent.com`) in `config.js` eintragen oder im
   Planer unter **Einstellungen → Google-Konto**.
6. Im Planer auf **Verbinden** klicken. Google warnt, dass die App nicht überprüft ist.
   Das ist bei eigenen Test-Apps normal, weiter über „Fortfahren“.

Der Planer fragt zwei Berechtigungen an: Kalender lesen (`calendar.readonly`, für die
Kalenderliste) und Termine bearbeiten (`calendar.events`, für Verschieben, Anlegen, Löschen).

**Andere Kalender über das eine Google-Konto:** Uni-Stundenplan, Outlook oder Arbeitskalender
lassen sich in Google Kalender unter **Weitere Kalender → Per URL** als ICS-Abo hinzufügen.
Sie erscheinen dann automatisch im Planer. Google aktualisiert solche Abos nur alle paar
Stunden, und sie sind schreibgeschützt.

## Wo die Daten liegen

- **Google-Termine** bleiben in Google. Der Planer lädt sie beim Öffnen, beim Blättern und
  alle fünf Minuten neu. Änderungen gehen sofort an Google.
- **Ziele, Aufgaben, Habits, lokale Termine und Einstellungen** liegen im `localStorage`
  dieses Browsers. Sie sind nicht auf anderen Geräten sichtbar. Unter
  **Einstellungen → Daten** gibt es eine Sicherung als JSON-Datei und das Laden daraus.
- Das Google-Zugriffstoken gilt eine Stunde und liegt ebenfalls im `localStorage`.
  Danach steht oben „Google neu verbinden“, ein Klick genügt.

## Online stellen

Am einfachsten über GitHub Pages: Repository-Einstellungen → Pages → Branch wählen, dann ist der
Planer unter `https://<name>.github.io/<repo>/planer/` erreichbar. Beim OAuth-Client
nur den Ursprung `https://<name>.github.io` als weitere JavaScript-Quelle eintragen, ohne Pfad.

## Grenzen und Ideen für später

- Aufgaben und Ziele synchronisieren nicht zwischen Geräten. Der nächste Schritt wäre, sie
  zusätzlich in Google zu speichern (z. B. Google Tasks oder eine Datei in Google Drive).
- Bei wiederkehrenden Google-Terminen ändert Verschieben nur den einen Termin, nicht die Serie.
- Termine zwischen zwei Google-Kalendern verschieben geht nur direkt in Google.
