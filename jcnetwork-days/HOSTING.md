# Auf Render hosten — Schritt für Schritt

Rechne mit 20 bis 30 Minuten. Du brauchst Konten bei **Supabase** (kostenlos)
und **Render** (kostenlos). Beide lassen sich mit dem GitHub-Konto anlegen.

Am Ende hast du drei Dinge:

1. das Board unter einer eigenen Adresse, offen für alle im Team — auch ohne
   Claude-Abo,
2. einen gemeinsamen Stand, den alle gleichzeitig sehen,
3. einen MCP-Server, den jede Person in ihre eigene Claude-App hängen kann.

---

## Vorab: zwei Dinge zur Sicherheit

**Euer Repository ist öffentlich.** Deshalb steht der Supabase-Schlüssel
nirgends im Code — Render setzt ihn beim Deploy aus einer Umgebungsvariablen
ein (`build.sh` erledigt das). Trage ihn nie direkt in `config.js` ein und
committe ihn nicht.

**Im Board stehen Handynummern von Helfenden.** Der Schlüssel, der im
ausgelieferten JavaScript landet, erlaubt Lesen und Schreiben. Wer die Adresse
kennt, kommt also an alles. Schritt 7 schließt das — überspring ihn nicht.

---

## Schritt 1 — Supabase-Projekt anlegen

1. [supabase.com](https://supabase.com) öffnen, **Start your project**, mit
   GitHub anmelden.
2. **New project**.
   - *Name*: `jcnetwork-days-2026`
   - *Database Password*: erzeugen lassen und im Passwortmanager sichern.
     Du brauchst es für das Board nicht, nur falls du je direkt an die
     Datenbank willst.
   - *Region*: **Frankfurt (eu-central-1)** — kürzeste Wege, und die Daten
     bleiben in der EU.
3. **Create new project**. Die Einrichtung dauert ein bis zwei Minuten.

## Schritt 2 — Tabelle anlegen

1. Links in der Seitenleiste **SQL Editor**, dann **New query**.
2. Den Inhalt von `jcnetwork-days/supabase-schema.sql` vollständig
   hineinkopieren.
3. **Run**. Unten muss *Success. No rows returned* stehen.

Das legt eine einzige Tabelle `jcnd` an. Das Board speichert darin alles:
Aufgabenstatus, Schichten, Material, Räume, Team.

## Schritt 3 — Zugangsdaten kopieren

1. In der Seitenleiste ganz unten **Project Settings**, dann **API Keys**
   (bei manchen Konten heißt der Punkt **API**).
2. Zwei Werte brauchst du gleich. Leg sie in eine Notiz:
   - **Project URL** — sieht aus wie `https://abcdefgh.supabase.co`
   - **anon public** — ein langer Text, der mit `eyJ` beginnt

> Nimm **nicht** den `service_role`-Schlüssel. Der hat volle Rechte und gehört
> niemals in eine Webseite.

---

## Schritt 4 — Render einrichten

1. [render.com](https://render.com) öffnen, mit GitHub anmelden.
2. Oben rechts **New**, dann **Blueprint**.
3. Repository `oliverfieder-star/websitetest` auswählen. Falls es nicht in der
   Liste steht: **Configure account** und Render Zugriff auf das Repository
   geben.
4. **Branch**: `claude/zen-faraday-13q37w` auswählen. Das ist wichtig — auf dem
   Standardbranch liegt das Board noch nicht.
5. Render findet `render.yaml` und zeigt zwei Dienste: **jcnd-board** und
   **jcnd-mcp**.

## Schritt 5 — Die abgefragten Werte eintragen

Render fragt jetzt nach den Werten, die nicht im Code stehen. Für **beide**
Dienste dieselben zwei:

| Feld | Wert |
|---|---|
| `SUPABASE_URL` | die Project URL aus Schritt 3 |
| `SUPABASE_KEY` | der `anon public`-Schlüssel aus Schritt 3 |

`MCP_TOKEN` erscheint nicht zur Eingabe — den würfelt Render selbst aus.

Dann **Apply**. Der erste Deploy dauert zwei bis vier Minuten.

## Schritt 6 — Nachsehen, ob es läuft

1. Im Render-Dashboard **jcnd-board** anklicken, oben steht die Adresse
   (`https://jcnd-board-xxxx.onrender.com`). Öffnen.
2. Du landest bei *Wer bist du?*. Wähle dich aus.
3. Unten links in der Fußzeile muss stehen: **geteilt über
   `deinprojekt.supabase.co`**.
   - Steht dort *nur auf diesem Gerät*, hat Schritt 5 nicht gegriffen: im
     Render-Dashboard unter **Environment** die beiden Werte prüfen und
     **Manual Deploy → Deploy latest commit** auslösen.
4. Zum Gegentest: eine Aufgabe abhaken, die Seite in einem privaten Fenster
   öffnen — der Haken muss dort auch stehen.

## Schritt 7 — Zugriff beschränken

Ohne diesen Schritt kann jede Person, die die Adresse kennt, alles lesen und
ändern — samt Handynummern.

**Der einfache Weg:** Im Render-Dashboard bei **jcnd-board** unter
**Settings → Protect Site** (auch **Password Protection**) ein Passwort
setzen. Das Passwort teilst du im Team. Fertig.

**Der bessere Weg** für ein Team mit Helfenden: die Seite über **Cloudflare
Pages** ausliefern und **Cloudflare Access** davorhängen — kostenlos bis
50 Personen, Anmeldung per E-Mail-Code, jede Person einzeln entziehbar. Mehr
Aufwand, aber sauberer, sobald mehr als eine Handvoll Leute Zugang haben.

**Wenn beides gerade nicht geht:** Handynummern leer lassen. Dann ist das
Board ein Nachschlagewerk für die Planung, kein Adressbuch.

---

## Schritt 8 — Claude anbinden (freiwillig)

Damit kann jede Person in ihrer **eigenen** Claude-App Fragen über den
Planstand stellen — „Wo ist die größte Lücke?", „Was ist in Logistik
überfällig?". Die Kosten trägt das jeweils eigene Abo; das Board selbst ruft
nichts auf.

1. Im Render-Dashboard **jcnd-mcp** öffnen, Reiter **Environment**.
2. Bei `MCP_TOKEN` auf das Auge klicken und den Wert kopieren.
3. Die Adresse des Dienstes steht oben (`https://jcnd-mcp-xxxx.onrender.com`).
4. Die Connector-Adresse ist beides zusammen:

   ```
   https://jcnd-mcp-xxxx.onrender.com/mcp/DEIN_TOKEN
   ```

5. In der Claude-App: **Einstellungen → Connectors → Connector hinzufügen**,
   diese Adresse eintragen.

Ein kurzer Test: frag Claude *„Gib mir den Projektüberblick der JCNetwork
Days"*. Es muss der Countdown und die Zahl der überfälligen Aufgaben kommen.

> Der Token ist der ganze Zugangsschutz. Behandle ihn wie ein Passwort und gib
> ihn nur im Team weiter. Mit falschem Token antwortet der Server mit 404.

---

## Wenn etwas klemmt

| Beobachtung | Ursache und Abhilfe |
|---|---|
| Fußzeile sagt *nur auf diesem Gerät* | `SUPABASE_URL`/`SUPABASE_KEY` fehlen beim **jcnd-board**. Unter Environment prüfen, neu deployen. |
| Fußzeile sagt *Verbindung unterbrochen* | Das SQL aus Schritt 2 lief nicht durch. Im Supabase **Table Editor** nachsehen, ob die Tabelle `jcnd` existiert. |
| Board lädt, aber bleibt leer | Ein Skript fehlt. Unter **Logs** beim Board nachsehen, ob `build.sh` durchlief. |
| Claude findet den Connector nicht | Tippfehler in der Adresse oder fehlendes `/mcp/` vor dem Token. Zum Prüfen die Adresse ohne `/mcp/...` im Browser öffnen — da muss ein Einzeiler stehen. |
| Erster Aufruf dauert ewig | Der Render-Free-Plan schläft nach 15 Minuten Leerlauf ein. Der nächste Aufruf weckt ihn in etwa 30 Sekunden. Für die Veranstaltungstage lohnen die 7 $/Monat für den bezahlten Plan. |

## Was danach automatisch passiert

Jeder Push auf den Branch löst einen neuen Deploy aus — beide Dienste
aktualisieren sich von selbst. Die Daten in Supabase bleiben davon unberührt.
