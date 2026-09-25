# Planer

Ein schlichter Kalender, aufgebaut wie Outlook. Er zeigt alle Kalender deines Google-Kontos und
ergänzt sie um Top 3 für Tag und Woche, Aufgaben mit Uhrzeit und einen Habit-Tracker. Claude
kann über einen eigenen Connector (MCP) mitlesen und mitplanen.

Du meldest dich nur mit deinem Google-Konto an. Alles andere erledigt der Server:

- **Termine** bleiben in Google Kalender und werden live gelesen und geändert.
- **Aufgaben, Ziele, Habits und Einstellungen** liegen als eine Datei im versteckten App-Ordner
  deines Google Drive. Du brauchst keine Datenbank, und alle Geräte sehen denselben Stand.
- **Claude** verbindet sich über `https://<deine-adresse>/mcp` und meldet sich mit demselben
  Google-Konto an.

```
public/          Oberfläche (HTML, CSS, JS, ohne Build-Schritt)
  app.js         Ansichten, Ziele, Aufgaben, Habits, Drag & Drop
  google.js      Kalender über den Server
  sync.js        Abgleich mit dem Server, Zusammenführen bei gleichzeitigen Änderungen
  shared.js      Datenaufbau und Zusammenführung, genutzt von Browser und Server
server/
  index.js       Express-Server und API für den Browser
  auth.js        „Mit Google anmelden“, Sitzungscookie
  google.js      Google OAuth, Kalender-API, Drive-Speicher
  store.js       Lesen und Schreiben der Planer-Datei je Nutzer
  oauth.js       OAuth-Server für den Claude-Connector
  mcp.js         MCP-Tools für Claude
render.yaml      (im Repo-Stamm) Render-Blueprint
```

## Einrichtung

Einmalig, etwa 20 Minuten. Die Reihenfolge ist wichtig, weil Google die Render-Adresse kennen muss.

### 1. Auf Render anlegen

1. Auf <https://dashboard.render.com> **New → Blueprint** wählen und dieses Repository verbinden.
   Render liest `render.yaml` und legt den Dienst `planer` an.
2. Die Felder `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` und `ALLOWED_EMAILS` erst einmal leer
   lassen oder bei `ALLOWED_EMAILS` schon deine Adresse eintragen. `SESSION_SECRET` erzeugt
   Render selbst.
3. Nach dem ersten Deploy steht oben die Adresse, z. B. `https://planer-xyz.onrender.com`.

### 2. Google Cloud einrichten

1. <https://console.cloud.google.com> öffnen und ein Projekt anlegen, z. B. „Planer“.
2. **APIs & Dienste → Bibliothek**: **Google Calendar API** und **Google Drive API** aktivieren.
3. **Google Auth Platform → Branding**: App-Name „Planer“ und deine E-Mail eintragen.
   **Zielgruppe**: „Extern“.
4. **Google Auth Platform → Clients → Client erstellen**, Typ **Webanwendung**. Unter
   **Autorisierte Weiterleitungs-URIs** eintragen:
   - `https://planer-xyz.onrender.com/auth/google/callback` (deine Render-Adresse)
   - `http://localhost:3000/auth/google/callback` (für den lokalen Start, optional)
5. Client-ID und Clientschlüssel kopieren.
6. **Zielgruppe → App veröffentlichen** („In Produktion“). Eine Prüfung durch Google ist dafür
   nicht nötig. Beim Anmelden zeigt Google dann einen Hinweis „App nicht überprüft“, weiter über
   „Erweitert → Zu Planer wechseln“.
   > Im Status „Testen“ laufen Googles Refresh-Tokens nach 7 Tagen ab. Dann müsstest du dich
   > jede Woche neu anmelden und Claude neu verbinden. Deshalb veröffentlichen.

### 3. Schlüssel bei Render eintragen

Im Render-Dienst unter **Environment**:

| Variable | Wert |
|---|---|
| `GOOGLE_CLIENT_ID` | aus Schritt 2 |
| `GOOGLE_CLIENT_SECRET` | aus Schritt 2 |
| `ALLOWED_EMAILS` | deine Google-Adresse, mehrere mit Komma getrennt |

Speichern, Render startet neu. Danach die Render-Adresse öffnen und **Mit Google anmelden**.
Bei der Zustimmung alle Häkchen setzen (Kalender und Drive-App-Ordner).

> `ALLOWED_EMAILS` unbedingt setzen: Eine veröffentlichte Google-App erlaubt sonst jedem
> Google-Konto die Anmeldung. Fremde sähen zwar nur ihre eigenen Daten, würden aber deinen Server nutzen.

### 4. Claude verbinden

1. Im Planer unter **Einstellungen → Mit Claude verbinden** die Adresse kopieren
   (`https://planer-xyz.onrender.com/mcp`).
2. In Claude **Einstellungen → Konnektoren → Benutzerdefinierten Konnektor hinzufügen**,
   Name „Planer“, Adresse einfügen, hinzufügen.
3. **Verbinden** klicken, mit Google anmelden, auf der Planer-Seite **Erlauben**.

Danach funktionieren Sätze wie „Was steht heute an?“, „Plan mir morgen zwei Stunden für die
Hausarbeit ein“, „Setz meine Top 3 für diese Woche“ oder „Hak Laufen für heute ab“.
Custom Connectors gibt es in den Claude-Tarifen Pro, Max, Team und Enterprise. In Team und
Enterprise muss sie eventuell ein Admin freigeben.

## Claude-Tools

| Tool | Wirkung |
|---|---|
| `get_overview` | Tag(e) im Überblick: Termine, Aufgaben, Top 3, Wochenziele, Überfälliges, Habits |
| `list_events` · `create_event` · `update_event` · `delete_event` | Termine in Google oder lokal |
| `list_tasks` · `create_task` · `update_task` · `delete_task` | Aufgaben, mit Uhrzeit auch im Kalender |
| `set_goals` · `check_goal` | Top 3 für Tag oder Woche setzen und abhaken |
| `list_habits` · `log_habit` · `create_habit` | Habits |
| `list_categories` | Lebensbereiche und Kalender mit Schreibrecht |

Claude arbeitet in der Zeitzone deines Google-Hauptkalenders. Schreibgeschützte Kalender
(z. B. abonnierte Stundenpläne) kann Claude lesen und einem Lebensbereich zuordnen, aber nicht ändern.

## Lokal starten

```bash
cd planer
cp .env.example .env      # Werte eintragen, Weiterleitungs-URI für localhost siehe oben
npm install
npm run local             # http://localhost:3000
```

Ohne Server (Datei direkt öffnen oder als statische Seite) läuft der Planer im **Demo-Modus**
mit Beispieldaten nur im Browser, ohne Google und ohne Claude.

## Funktionen

**Kalender wie in Outlook**
- Ansichten Tag, Arbeitswoche, Woche und Monat, dazu ein Minikalender und die Kalenderliste links
- Alle Kalender des Google-Kontos, jeweils ein- und ausblendbar. Auch Uni-Stundenplan, Outlook
  oder Arbeitskalender gehören dazu, wenn du sie in Google unter **Weitere Kalender → Per URL**
  abonnierst (Google aktualisiert solche Abos nur alle paar Stunden, sie sind schreibgeschützt)
- Termine per Drag & Drop verschieben, an der Unterkante die Dauer ändern, in der Monatsansicht
  auf einen anderen Tag ziehen
- Klick in eine freie Stelle legt einen Eintrag an, Ziehen legt gleich die Dauer fest
- Neue Termine landen in einem Google-Kalender oder lokal im Planer

**Top 3 für heute und für die Woche**
- Über dem Kalender stehen die drei Tagesziele des ausgewählten Tages und die drei Wochenziele
- Im Wochenkopf zeigen drei Punkte je Tag, wie viele Tagesziele erledigt sind

**Aufgaben**
- Rechte Leiste: Aufgabe eintippen, optional mit Uhrzeit und Lebensbereich
- In den Kalender ziehen gibt ihr eine Uhrzeit, danach verhält sie sich wie ein Termin
- Zurück in die Liste ziehen nimmt die Uhrzeit weg, auf „Irgendwann“ ziehen das Datum

**Lebensbereiche**
- Voreingestellt: Universität, Arbeit, Selbständigkeit, Privates, Sport. In den Einstellungen änderbar
- Jeder Google-Kalender bekommt einen Standardbereich, einzelne Termine lassen sich umstellen
- Links lassen sich Bereiche ausblenden. Daneben stehen die eingeplanten Stunden je Bereich

**Habits**
- Täglich oder als Wochenziel (z. B. 3× pro Woche), mit Serie und Quote der letzten 30 Tage
- Die Habits des ausgewählten Tages sind auch in der Aufgabenleiste abhakbar

**Tastatur:** `←` `→` blättern · `t` heute · `d` `a` `w` `m` Ansicht · `n` neu · `1` `2` `3` Bereiche

## Gut zu wissen

- **Render Free** schläft nach 15 Minuten ohne Aufruf ein. Der erste Aufruf danach dauert
  bis zu einer Minute, auch für Claude. Wenn dich das stört, reicht der Tarif „Starter“.
- **Gleichzeitige Änderungen** (zwei Geräte, oder du und Claude) werden zusammengeführt.
  Nur wenn beide dasselbe Feld derselben Aufgabe ändern, gewinnt der Browser.
- **Daten ansehen oder löschen:** Die Drive-Datei ist in Google Drive unter
  **Einstellungen → Apps verwalten → Planer** zu finden. Außerdem gibt es in den
  Planer-Einstellungen eine Sicherung als JSON-Datei.
- **Alles abmelden:** Einen neuen `SESSION_SECRET` bei Render setzen. Das beendet alle
  Browser-Sitzungen und trennt Claude. Den Google-Zugriff selbst widerrufst du unter
  <https://myaccount.google.com/permissions>.
- Bei wiederkehrenden Google-Terminen ändert Verschieben nur den einen Termin, nicht die Serie.
