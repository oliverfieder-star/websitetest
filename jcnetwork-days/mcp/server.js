/* MCP-Server für das Planungsboard der JCNetwork Days 2026.
 *
 * Läuft neben dem Board (z. B. als Web Service auf Render) und liest
 * denselben Stand. Jede Person hängt ihn in ihrer eigenen Claude-App als
 * Connector ein — die Kosten trägt damit jede Claude-Nutzung selbst, das
 * Board ruft weiterhin nichts auf.
 *
 * Nur lesend. Geändert wird im Board.
 */
import express from "express";
import { timingSafeEqual } from "node:crypto";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  RACI, aufgaben, personal, sammlung, dokument, OPS,
  TAGE, slotWert, tageBis, EVENT_START
} from "./daten.js";

const TOKEN = process.env.MCP_TOKEN || "";
const PORT = process.env.PORT || 8080;
const BOARD_PW = process.env.BOARD_PASSWORD || "";
const BOARD_USER = process.env.BOARD_USER || "team";
const BOARD_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const text = t => ({ content: [{ type: "text", text: t }] });
const liste = (xs, f) => xs.length ? xs.map(f).join("\n") : "— nichts gefunden —";

function bauen() {
  const s = new McpServer(
    { name: "jcnetwork-days-2026", version: "1.0.0" },
    { instructions:
      "Planungsstand der JCNetwork Days 2026 (3.–6. Dezember, Würzburg): RACI-Aufgaben, " +
      "Personalbedarf gegen Schichten, Logistik und Workshopräume. Alle Werkzeuge lesen nur; " +
      "Änderungen macht das Team im Board. Zeitzone Europe/Berlin. Ein Veranstaltungstag läuft " +
      "von 06:00 bis in die Nacht — 01:00 gehört noch zum Vorabend." }
  );

  s.registerTool("aufgaben_offen", {
    title: "Offene Aufgaben",
    description: "Offene RACI-Aufgaben, wahlweise nach Bereich, Person oder Dringlichkeit gefiltert. " +
      "Ohne Filter kommen die überfälligen zuerst.",
    inputSchema: {
      bereich: z.string().optional().describe("Name eines der zwölf Bereiche, z. B. 'Logistik'."),
      person: z.string().optional().describe("Teil eines Namens; findet Aufgaben, die diese Person verantwortet oder ausführt."),
      nur_ueberfaellig: z.boolean().optional().describe("Nur Aufgaben, deren Deadline vorbei ist."),
      limit: z.number().int().min(1).max(200).optional().describe("Höchstzahl der Zeilen, Vorgabe 40.")
    }
  }, async ({ bereich, person, nur_ueberfaellig, limit }) => {
    let xs = (await aufgaben()).filter(a => a.status !== "erledigt");
    if (bereich) xs = xs.filter(a => a.bereich.toLowerCase().includes(bereich.toLowerCase()));
    if (person) { const p = person.toLowerCase();
      xs = xs.filter(a => [...a.verantwortlich, ...a.ausfuehrend].some(n => n.toLowerCase().includes(p))); }
    if (nur_ueberfaellig) xs = xs.filter(a => a.tageBisFrist !== null && a.tageBisFrist < 0);
    xs.sort((a, b) => (a.tageBisFrist ?? 1e6) - (b.tageBisFrist ?? 1e6));
    const n = limit || 40, zeigen = xs.slice(0, n);
    return text(`${xs.length} offene Aufgaben${xs.length > n ? `, die ersten ${n}` : ""}:\n\n` +
      liste(zeigen, a => {
        const frist = a.tageBisFrist === null ? "ohne Datum"
          : a.tageBisFrist < 0 ? `${-a.tageBisFrist} Tage über der Deadline`
          : `noch ${a.tageBisFrist} Tage`;
        const wer = a.verantwortlich.length ? `verantwortlich: ${a.verantwortlich.join(", ")}`
          : a.ausfuehrend.length ? `macht: ${a.ausfuehrend.join(", ")}` : "niemand mit Namen zugeordnet";
        return `• [${a.bereich}] ${a.aufgabe}\n  Deadline ${a.deadline} (${frist}) · ${wer}` +
          `${a.status !== "offen" ? ` · Status: ${a.status}` : ""}${a.notiz ? `\n  Notiz: ${a.notiz}` : ""}`;
      }));
  });

  s.registerTool("bereich_status", {
    title: "Soll und Ist je Einsatzbereich",
    description: "Personalbedarf gegen tatsächlich eingeteilte Schichten. Ohne Bereichsangabe " +
      "kommt eine Übersicht aller Einsatzbereiche mit Abdeckungsquote.",
    inputSchema: {
      bereich: z.string().optional().describe("Name eines Einsatzbereichs, z. B. 'Lager' oder 'Check-In'."),
      tag: z.enum(["Do", "Fr", "Sa", "So"]).optional().describe("Veranstaltungstag; ohne Angabe alle vier.")
    }
  }, async ({ bereich, tag }) => {
    const { bedarf, istBei } = await personal();
    const tage = tag ? [tag] : TAGE.map(t => t[0]);
    const zeilen = [];
    for (const tk of tage) {
      const bd = bedarf[tk] || {};
      for (const ber of Object.keys(bd)) {
        if (bereich && !ber.toLowerCase().includes(bereich.toLowerCase())) continue;
        const slots = Object.keys(bd[ber]);
        let soll = 0, ist = 0;
        for (const sl of slots) { soll += bd[ber][sl]; ist += Math.min(bd[ber][sl], istBei(tk, ber, sl).length); }
        const lang = TAGE.find(t => t[0] === tk)[1];
        zeilen.push(`• ${lang} — ${ber}: ${(soll ? ist / soll * 100 : 100).toFixed(0)} % abgedeckt ` +
          `(${(ist / 2).toFixed(1)} von ${(soll / 2).toFixed(1)} Personenstunden)`);
      }
    }
    return text(zeilen.length ? zeilen.join("\n") : "Für diese Auswahl ist kein Bedarf hinterlegt.");
  });

  s.registerTool("luecken_finden", {
    title: "Unterbesetzte Zeitfenster",
    description: "Alle Zeitfenster, in denen weniger Helfende eingeteilt sind als gebraucht werden. " +
      "Zusammenhängende Fenster werden zu einer Lücke zusammengefasst.",
    inputSchema: {
      tag: z.enum(["Do", "Fr", "Sa", "So"]).optional().describe("Veranstaltungstag; ohne Angabe alle vier."),
      bereich: z.string().optional().describe("Name eines Einsatzbereichs.")
    }
  }, async ({ tag, bereich }) => {
    const { bedarf, istBei } = await personal();
    const tage = tag ? [tag] : TAGE.map(t => t[0]);
    const raus = [];
    for (const tk of tage) {
      const bd = bedarf[tk] || {};
      for (const ber of Object.keys(bd)) {
        if (bereich && !ber.toLowerCase().includes(bereich.toLowerCase())) continue;
        const slots = Object.keys(bd[ber]).sort((a, b) => slotWert(a) - slotWert(b));
        let lauf = null;
        for (const sl of slots) {
          const fehlt = bd[ber][sl] - istBei(tk, ber, sl).length;
          const bis = ((slotWert(sl) + 30) % 1440);
          const bisTxt = String(Math.floor(bis / 60)).padStart(2, "0") + ":" + String(bis % 60).padStart(2, "0");
          if (fehlt > 0) {
            if (lauf && lauf.bis === sl && lauf.fehlt === fehlt) lauf.bis = bisTxt;
            else { if (lauf) raus.push(lauf); lauf = { tk, ber, von: sl, bis: bisTxt, fehlt }; }
          } else if (lauf) { raus.push(lauf); lauf = null; }
        }
        if (lauf) raus.push(lauf);
      }
    }
    raus.sort((a, b) => b.fehlt - a.fehlt);
    return text(`${raus.length} unterbesetzte Fenster:\n\n` + liste(raus, l =>
      `• ${TAGE.find(t => t[0] === l.tk)[1]} ${l.von}–${l.bis} · ${l.ber}: ${l.fehlt} fehlen`));
  });

  s.registerTool("helfer_schichten", {
    title: "Schichten einer Person",
    description: "Alle Schichten einer helfenden Person chronologisch, mit Stunden.",
    inputSchema: { name: z.string().describe("Teil des Vor- oder Nachnamens.") }
  }, async ({ name }) => {
    const { schichten, helfende, name: nm } = await personal();
    const p = name.toLowerCase();
    const treffer = helfende.filter(h => `${h.vorname || ""} ${h.nachname || ""}`.toLowerCase().includes(p));
    if (!treffer.length) return text(`Niemand gefunden, dessen Name „${name}" enthält.`);
    return text(treffer.map(h => {
      const xs = schichten.filter(s => s.helfer === h.id)
        .sort((a, b) => TAGE.findIndex(t => t[0] === a.tag) - TAGE.findIndex(t => t[0] === b.tag) || slotWert(a.von) - slotWert(b.von));
      const std = xs.reduce((a, s) => a + (slotWert(s.bis) - slotWert(s.von)) / 60, 0);
      return `${nm(h.id)} — ${xs.length} Schichten, ${std.toFixed(1)} Stunden` +
        (h.tel ? ` · ${h.tel}` : "") + "\n" +
        liste(xs, s => `  • ${TAGE.find(t => t[0] === s.tag)[1]} ${s.von}–${s.bis} · ${s.bereich}`);
    }).join("\n\n"));
  });

  s.registerTool("helfende_suchen", {
    title: "Helfende suchen",
    description: "Helfende nach Name oder Merkmalen suchen (Führerschein, Erste Hilfe, Sprinter, " +
      "ohne Schicht) samt geplanter Stunden.",
    inputSchema: {
      name: z.string().optional(), fuehrerschein: z.boolean().optional(),
      erste_hilfe: z.boolean().optional(), sprinter_bereit: z.boolean().optional(),
      ohne_schicht: z.boolean().optional().describe("Nur Personen ohne jede Zuweisung.")
    }
  }, async (a) => {
    const { schichten, helfende, name: nm } = await personal();
    let xs = helfende;
    if (a.name) xs = xs.filter(h => `${h.vorname || ""} ${h.nachname || ""}`.toLowerCase().includes(a.name.toLowerCase()));
    if (a.fuehrerschein) xs = xs.filter(h => h.fs);
    if (a.erste_hilfe) xs = xs.filter(h => h.eh);
    if (a.sprinter_bereit) xs = xs.filter(h => h.sprinter);
    if (a.ohne_schicht) xs = xs.filter(h => !schichten.some(s => s.helfer === h.id));
    return text(`${xs.length} Personen:\n\n` + liste(xs, h => {
      const std = schichten.filter(s => s.helfer === h.id)
        .reduce((x, s) => x + (slotWert(s.bis) - slotWert(s.von)) / 60, 0);
      const merk = [h.fs && "Führerschein", h.eh && "Erste Hilfe", h.sprinter && "Sprinter", h.ernaehrung]
        .filter(Boolean).join(", ");
      return `• ${nm(h.id)} — ${std.toFixed(1)} h geplant${merk ? ` · ${merk}` : ""}${h.tel ? ` · ${h.tel}` : ""}`;
    }));
  });

  s.registerTool("material_status", {
    title: "Logistik und Material",
    description: "Materialposten nach Station (Tag, Ort, Programmpunkt), mit Herkunft und Packstatus. " +
      "Zeigt auch, was als Verbrauch gilt und was zurück muss.",
    inputSchema: {
      ort: z.string().optional(), nur_offen: z.boolean().optional().describe("Nur noch nicht gepackte Posten.")
    }
  }, async ({ ort, nur_offen }) => {
    let xs = await sammlung("logi");
    if (ort) xs = xs.filter(p => (p.ort || "").toLowerCase().includes(ort.toLowerCase()));
    if (nur_offen) xs = xs.filter(p => p.status === "offen");
    if (!xs.length) return text("Keine Logistikposten für diese Auswahl.");
    const gruppen = {};
    for (const p of xs) (gruppen[`${p.tag} · ${p.ort} · ${p.punkt}`] ||= []).push(p);
    return text(`${xs.length} Posten:\n\n` + Object.entries(gruppen).map(([k, ps]) =>
      `${k}\n` + ps.map(p => `  • ${p.menge} ${p.einheit} ${p.material} — von ${p.quelle || "?"}` +
        `, ${p.art === "v" ? "Verbrauch" : "muss zurück"}, ${p.status}` +
        `${p.vonBereich ? ` (angefordert von ${p.vonBereich})` : ""}`).join("\n")).join("\n\n"));
  });

  s.registerTool("raum_status", {
    title: "Workshopräume",
    description: "Räume mit Ausstattung, zugeordneten Workshops und dem, was gegenüber dem " +
      "Workshop-Bedarf noch fehlt.",
    inputSchema: { location: z.string().optional() }
  }, async ({ location }) => {
    const [raeume, ws] = await Promise.all([sammlung("raum"), sammlung("ws")]);
    let xs = raeume;
    if (location) xs = xs.filter(r => (r.loc || "").toLowerCase().includes(location.toLowerCase()));
    if (!xs.length) return text("Keine Räume angelegt.");
    return text(liste(xs, r => {
      const meine = ws.filter(w => w.raum === r.id);
      const braucht = k => meine.reduce((a, w) => Math.max(a, +w[k] || 0), 0);
      const fehlt = [["bBeamer", "beamer", "Beamer"], ["bFlip", "flip", "Flipcharts"], ["bMeta", "meta", "Metaplanwände"]]
        .map(([b, f, l]) => { const d = braucht(b) - (+r[f] || 0); return d > 0 ? `${d} ${l}` : null; })
        .filter(Boolean);
      return `• ${r.loc} / ${r.name} (${r.plaetze || "?"} Plätze)\n` +
        `  vorhanden: Beamer ${r.beamer || 0}, Flipcharts ${r.flip || 0}, Metaplanwände ${r.meta || 0}\n` +
        `  Workshops: ${meine.length ? meine.map(w => `${w.firma} (Slot ${w.slot}, ${w.tag})`).join(", ") : "keine"}\n` +
        `  ${fehlt.length ? `FEHLT: ${fehlt.join(", ")}` : "vollständig ausgestattet"}`;
    }));
  });

  s.registerTool("projekt_ueberblick", {
    title: "Überblick",
    description: "Kurzer Gesamtstand: Countdown, offene und überfällige Aufgaben je Bereich, " +
      "Personallücken, offene Logistikposten.",
    inputSchema: {}
  }, async () => {
    const [xs, { bedarf, istBei }, logi] = await Promise.all([aufgaben(), personal(), sammlung("logi")]);
    const offen = xs.filter(a => a.status !== "erledigt");
    const spaet = offen.filter(a => a.tageBisFrist !== null && a.tageBisFrist < 0);
    const jeBereich = {};
    for (const a of offen) (jeBereich[a.bereich] ||= { offen: 0, spaet: 0 }).offen++;
    for (const a of spaet) jeBereich[a.bereich].spaet++;
    let fehlstunden = 0;
    for (const [tk] of TAGE) { const bd = bedarf[tk] || {};
      for (const ber of Object.keys(bd)) for (const sl of Object.keys(bd[ber]))
        fehlstunden += Math.max(0, bd[ber][sl] - istBei(tk, ber, sl).length) / 2; }
    return text(
      `JCNetwork Days 2026 — Würzburg, 3.–6. Dezember. Noch ${tageBis(EVENT_START)} Tage.\n\n` +
      `Aufgaben: ${offen.length} offen, davon ${spaet.length} über der Deadline.\n` +
      Object.entries(jeBereich).sort((a, b) => b[1].spaet - a[1].spaet)
        .map(([b, z]) => `  • ${b}: ${z.offen} offen${z.spaet ? `, ${z.spaet} überfällig` : ""}`).join("\n") +
      `\n\nPersonal: ${fehlstunden.toFixed(1)} Personenstunden noch unbesetzt.\n` +
      `Logistik: ${logi.length} Posten, ${logi.filter(p => p.status === "offen").length} noch nicht gepackt.`);
  });

  return s;
}

/* Zeitkonstanter Vergleich — verrät über die Antwortdauer nichts. */
function gleich(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}
/* Passwortschutz fürs Board. Render bietet für Static Sites keinen an —
   deshalb liefert dieser Dienst das Board gleich mit aus, hinter
   HTTP-Basisauthentifizierung. Damit ist auch config.js geschützt, in der
   der Supabase-Schlüssel steht. */
function schutz(q, r, next) {
  if (!BOARD_PW) return next();
  const [typ, wert] = String(q.headers.authorization || "").split(" ");
  if (typ === "Basic" && wert) {
    const roh = Buffer.from(wert, "base64").toString("utf8");
    const i = roh.indexOf(":");
    if (i > 0 && gleich(roh.slice(0, i), BOARD_USER) && gleich(roh.slice(i + 1), BOARD_PW)) return next();
  }
  r.set("WWW-Authenticate", 'Basic realm="JCNetwork Days 2026", charset="UTF-8"');
  r.status(401).type("text/plain").send("Zugang nur mit Passwort.");
}

const app = express();
app.use(express.json({ limit: "4mb" }));
app.get("/gesund", (_q, r) => r.json({ ok: true }));
app.get("/mcp", (_q, r) => r.type("text/plain").send(
  "MCP-Server der JCNetwork Days 2026. Endpunkt: POST /mcp/<token>"));

app.post("/mcp/:token", async (q, r) => {
  if (!TOKEN || q.params.token !== TOKEN) {
    return r.status(404).json({ jsonrpc: "2.0", error: { code: -32001, message: "Nicht gefunden" }, id: null });
  }
  // Staatenlos: je Anfrage ein frischer Server, damit mehrere Personen
  // gleichzeitig fragen können, ohne dass Render klebrige Sitzungen braucht.
  const server = bauen();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  r.on("close", () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(q, r, q.body);
  } catch (e) {
    console.error(e);
    if (!r.headersSent) r.status(500).json({
      jsonrpc: "2.0", error: { code: -32603, message: String(e.message || e) }, id: null });
  }
});

/* Ab hier das Board. config.js wird zur Laufzeit aus den Umgebungsvariablen
   erzeugt, damit der Supabase-Schlüssel nirgends auf der Platte liegt. */
app.get(["/config.js", "/jcnetwork-days/config.js"], schutz, (_q, r) =>
  r.type("application/javascript").send(
    `"use strict";\n/* Zur Laufzeit erzeugt. */\nwindow.JCND_CONFIG = ` +
    JSON.stringify({ supabaseUrl: process.env.SUPABASE_URL || "",
                     supabaseKey: process.env.SUPABASE_KEY || "" }) + ";\n"));

// Der Ordner mcp/ selbst wird nie ausgeliefert — dort liegt der Quelltext
// dieses Dienstes.
app.use((q, r, next) =>
  normalize(decodeURIComponent(q.path)).startsWith("/mcp")
    ? r.status(404).type("text/plain").send("Nicht gefunden") : next());
app.use(schutz, express.static(BOARD_DIR, { index: "index.html", extensions: ["html"] }));

app.listen(PORT, () => {
  console.log(`MCP-Server lauscht auf Port ${PORT}`);
  if (!TOKEN) console.warn("WARNUNG: MCP_TOKEN ist nicht gesetzt — der MCP-Endpunkt antwortet auf nichts.");
  if (!BOARD_PW) console.warn("WARNUNG: BOARD_PASSWORD ist nicht gesetzt — das Board ist ohne Passwort erreichbar.");
  else console.log(`Board unter / mit Passwortschutz (Benutzer „${BOARD_USER}").`);
  if (!process.env.SUPABASE_URL) console.warn("Hinweis: ohne SUPABASE_URL kommt nur die RACI, kein geteilter Stand.");
});
