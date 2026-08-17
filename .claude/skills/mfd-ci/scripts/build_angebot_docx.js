/**
 * Verbindliches Angebot: Status-quo-Analyse (Digital-Check) als
 * Word-Dokument im Mainfranken-Digital-CI. Unterschriftsreif:
 * Anschreiben, Leistungsumfang, Vergütung, Konditionen, Annahme.
 *
 * Individualisieren: nur KONFIG anpassen, dann
 *     node build_angebot_docx.js [ziel.docx]
 *
 * Fachlich fix: Digital-Check pauschal 1.900 € netto.
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, LevelFormat, ShadingType,
  Header, Footer, PageNumber, TabStopType,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Individualisierung: nur diesen Block anpassen ────────────────────
const KONFIG = {
  ANGEBOTS_NR: "[JJJJ-NNN]",
  DATUM: "[TT.MM.JJJJ]",
  BINDEFRIST: "[TT.MM.JJJJ]",          // üblich: Datum + 30 Tage
  KUNDE_FIRMA: "[Firma des Auftraggebers]",
  KUNDE_STRASSE: "[Straße Hausnummer]",
  KUNDE_ORT: "[PLZ Ort]",
  KUNDE_ANSPRECHPARTNER: "[Vorname Nachname]",
  ANREDE: "[Sehr geehrter Herr … / Sehr geehrte Frau …]",
  // Bezug auf das Erstgespräch, zwei bis drei Sätze:
  ERSTGESPRAECH: "[TT.MM.JJJJ]",
  AUSGANGSLAGE:
    "[Aus dem Erstgespräch: Die Angebots- und Rechnungsstellung läuft " +
    "verstreut über mehrere Systeme; die Ablage kostet spürbar Zeit. " +
    "Die Analyse soll klären, welche Abläufe sich mit welchem Aufwand " +
    "digitalisieren lassen.]",
  NEBENKOSTEN: "[An- und Abreise inklusive / nach Aufwand: … € je km]",
  BERICHTSFRIST: "[10 Werktagen]",     // nach dem Analysetag
};

const PREIS_NETTO = 1900;
const UST = Math.round(PREIS_NETTO * 0.19);
const BRUTTO = PREIS_NETTO + UST;
const euro = (n) => n.toLocaleString("de-DE") + " €";

// ── CI ───────────────────────────────────────────────────────────────
const GRAPHIT = "14171C";
const STAHL = "5B7A94";      // Stahl, für Druck auf Weiß abgedunkelt
const GRAU = "5A6068";
const LINIE = "C9CCD1";
const DISPLAY = "Space Grotesk";
const MONO = "Consolas";

const STAMM = {
  firma: "Fieder Handels GmbH",
  marke: "Mainfranken Digital",
  strasse: "Versbacher Straße 20",
  ort: "97078 Würzburg",
  register: "Amtsgericht Würzburg, HRB 17397",
  gf: "Geschäftsführer: Oliver Fieder",
  ustid: "USt-ID DE3370133371",
  tel: "0179 213 74 76",
  mail: "oliver@mainfranken-digital.de",
};

// ── Bausteine ────────────────────────────────────────────────────────
const t = (text, opt = {}) => new TextRun({
  text, font: opt.mono ? MONO : DISPLAY,
  size: (opt.pt || 11) * 2, bold: !!opt.fett,
  color: opt.farbe || GRAPHIT,
  ...(opt.sperrung ? { characterSpacing: opt.sperrung * 20 } : {}),
});

const abs = (kinder, opt = {}) => new Paragraph({
  children: Array.isArray(kinder) ? kinder : [kinder],
  alignment: opt.align || (opt.blocksatz ? AlignmentType.JUSTIFIED : AlignmentType.LEFT),
  spacing: { after: opt.nach ?? 160, before: opt.vor ?? 0, line: 288, lineRule: "auto" },
  ...(opt.rest || {}),
});

const kicker = (text, opt = {}) => abs(
  t(text.toUpperCase(), { mono: true, pt: 8.5, farbe: STAHL, sperrung: 2 }), opt);

const ueberschrift = (nr, text) => abs(
  [t(`${nr}  `, { mono: true, pt: 11, farbe: STAHL, fett: true }),
   t(text.toUpperCase(), { pt: 12.5, fett: true })],
  { vor: 320, nach: 140 });

const body = (text, opt = {}) => abs(t(text, { pt: 11, farbe: opt.farbe || GRAPHIT }),
  { blocksatz: true, ...opt });

const feineLinie = () => new Paragraph({
  spacing: { after: 120, before: 120 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINIE } },
});

// Tabellen-Helfer für Vergütung
const zelle = (kinder, breite, opt = {}) => new TableCell({
  width: { size: breite, type: WidthType.DXA },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 4, color: opt.stark ? STAHL : LINIE },
    bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
  },
  margins: { top: 110, bottom: 110, left: 0, right: 0 },
  shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
  children: kinder,
});

function verguetungsTabelle() {
  const B = [900, 6040, 2400];
  const zeile = (pos, beschr, preis, opt = {}) => new TableRow({
    children: [
      zelle([abs(t(pos, { mono: true, pt: 10, farbe: STAHL }), { nach: 0 })], B[0], opt),
      zelle([abs(t(beschr, { pt: 11, fett: !!opt.fett }), { nach: 0 })], B[1], opt),
      zelle([abs(t(preis, { pt: 11, fett: !!opt.fett, farbe: opt.preisFarbe || GRAPHIT }),
                 { nach: 0, align: AlignmentType.RIGHT })], B[2], opt),
    ],
  });
  return new Table({
    width: { size: 9340, type: WidthType.DXA },
    columnWidths: B,
    rows: [
      zeile("01", "Status-quo-Analyse (Digital-Check), pauschal", euro(PREIS_NETTO)),
      zeile("02", `Nebenkosten: ${KONFIG.NEBENKOSTEN}`, ""),
      zeile("", "Umsatzsteuer 19 %", euro(UST)),
      zeile("", "Gesamtbetrag brutto", euro(BRUTTO), { stark: true, fett: true, preisFarbe: STAHL }),
    ],
  });
}

// ── Dokument ─────────────────────────────────────────────────────────
const k = KONFIG;

const kopf = new Header({
  children: [
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: 9340 }],
      spacing: { after: 60 },
      children: [
        t("MAINFRANKEN ", { pt: 13, fett: true, sperrung: 1.5 }),
        t("DIGITAL", { pt: 13, fett: true, farbe: STAHL, sperrung: 1.5 }),
        new TextRun({ text: "\t" }),
        t("VERBINDLICHES ANGEBOT", { mono: true, pt: 8.5, farbe: GRAU, sperrung: 2 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINIE } },
    }),
  ],
});

const fuss = new Footer({
  children: [
    new Paragraph({
      spacing: { before: 60, after: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINIE } },
      tabStops: [{ type: TabStopType.RIGHT, position: 9340 }],
      children: [
        t(`${STAMM.firma} · ${STAMM.strasse} · ${STAMM.ort} · ${STAMM.register} · ` +
          `${STAMM.gf} · ${STAMM.ustid}`, { pt: 7.5, farbe: GRAU }),
        new TextRun({ text: "\t" }),
        new TextRun({
          font: MONO, size: 15, color: GRAU,
          children: ["Seite ", PageNumber.CURRENT, " von ", PageNumber.TOTAL_PAGES],
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 20, after: 0 },
      children: [t(`Telefon ${STAMM.tel} · ${STAMM.mail} · „${STAMM.marke}“ ist ein ` +
                   `Angebot der ${STAMM.firma}.`, { pt: 7.5, farbe: GRAU })],
    }),
  ],
});

const inhalt = [
  // Absenderzeile + Empfänger
  abs(t(`${STAMM.firma} · ${STAMM.strasse} · ${STAMM.ort}`, { pt: 8, farbe: GRAU }),
      { vor: 240, nach: 200 }),
  abs(t(k.KUNDE_FIRMA, { pt: 11, fett: true }), { nach: 20 }),
  abs(t(k.KUNDE_STRASSE, { pt: 11 }), { nach: 20 }),
  abs(t(k.KUNDE_ORT, { pt: 11 }), { nach: 20 }),
  abs(t(`z. Hd. ${k.KUNDE_ANSPRECHPARTNER}`, { pt: 11 }), { nach: 320 }),

  // Meta-Zeile
  abs([
    t("ANGEBOT NR. ", { mono: true, pt: 8.5, farbe: GRAU, sperrung: 1.5 }),
    t(k.ANGEBOTS_NR, { mono: true, pt: 8.5, farbe: GRAPHIT, sperrung: 1.5 }),
    t("   ·   DATUM ", { mono: true, pt: 8.5, farbe: GRAU, sperrung: 1.5 }),
    t(k.DATUM, { mono: true, pt: 8.5, farbe: GRAPHIT, sperrung: 1.5 }),
    t("   ·   GEBUNDEN BIS ", { mono: true, pt: 8.5, farbe: GRAU, sperrung: 1.5 }),
    t(k.BINDEFRIST, { mono: true, pt: 8.5, farbe: STAHL, sperrung: 1.5 }),
  ], { nach: 120 }),
  feineLinie(),

  // Titel
  kicker("Angebot", { vor: 160, nach: 60 }),
  abs([t("STATUS-QUO-ANALYSE ", { pt: 20, fett: true }),
       t("DIGITAL-CHECK", { pt: 20, fett: true, farbe: STAHL }),
       t(".", { pt: 20, fett: true })], { nach: 280 }),

  // Anschreiben
  body(`${k.ANREDE},`),
  body(`vielen Dank für das Gespräch am ${k.ERSTGESPRAECH}. Wie besprochen ` +
       `erhalten Sie unser Angebot für eine Status-quo-Analyse Ihrer Abläufe ` +
       `in Büro und Verwaltung. Ziel ist ein belastbares Bild: was heute wie ` +
       `läuft, was sich mit welchem Aufwand digitalisieren lässt und welche ` +
       `Maßnahmen über den Digitalbonus Bayern förderfähig sind.`),

  ueberschrift("1", "Ausgangslage und Ziel"),
  body(k.AUSGANGSLAGE),
  body("Die Analyse liefert eine priorisierte Maßnahmenliste mit Aufwands- " +
       "und Nutzenschätzung sowie eine Einschätzung zur Förderfähigkeit. " +
       "Danach können Sie fundiert entscheiden, ob und was Sie umsetzen; " +
       "eine Verpflichtung zu Folgeaufträgen besteht nicht."),

  ueberschrift("2", "Leistungsumfang"),
  ...[
    ["Vorbereitung", "Kurzfragebogen vorab; Sichtung vorhandener Unterlagen und Systeme."],
    ["Analysetag vor Ort", "Ein Arbeitstag in Ihrem Betrieb (Termin nach gemeinsamer " +
     "Abstimmung): Aufnahme der Abläufe in Büro und Verwaltung, Gespräche mit den Beteiligten."],
    ["Ergebnisbericht", `Schriftlicher Bericht innerhalb von ${k.BERICHTSFRIST} nach dem ` +
     "Analysetag: Ist-Aufnahme, priorisierte Maßnahmen mit Aufwands- und Nutzenschätzung, " +
     "Einschätzung zur Förderfähigkeit (Digitalbonus Bayern)."],
    ["Ergebnisgespräch", "Rund 60 Minuten, vor Ort oder online: Bericht durchgehen, " +
     "Fragen klären, mögliche nächste Schritte."],
  ].map(([titel, text], i) => abs([
    t(`2.${i + 1}  `, { mono: true, pt: 10, farbe: STAHL }),
    t(`${titel}: `, { pt: 11, fett: true }),
    t(text, { pt: 11 }),
  ], { blocksatz: true })),
  body("Nicht Bestandteil dieses Angebots sind Umsetzungsleistungen (z. B. " +
       "Einführung von Software, Schulungen, Website-Arbeiten); diese werden " +
       "bei Bedarf separat angeboten."),

  ueberschrift("3", "Vergütung"),
  verguetungsTabelle(),
  body("Die Rechnung wird nach dem Ergebnisgespräch gestellt und ist " +
       "innerhalb von 14 Tagen ab Zugang ohne Abzug zahlbar.", { vor: 200 }),

  ueberschrift("4", "Termine und Mitwirkung"),
  body("Der Analysetag wird nach Beauftragung gemeinsam festgelegt. " +
       "Verschiebungen sind für beide Seiten bis fünf Werktage vor dem " +
       "Termin kostenfrei möglich. Der Auftraggeber stellt am Analysetag " +
       "Räume, relevante Unterlagen und die erforderlichen Ansprechpartner " +
       "zur Verfügung."),

  ueberschrift("5", "Vertraulichkeit und Datenschutz"),
  body("Beide Seiten behandeln alle im Rahmen des Projekts erlangten " +
       "Geschäfts- und Betriebsinformationen vertraulich, auch über das " +
       "Projektende hinaus. Personenbezogene Daten werden ausschließlich " +
       "zur Durchführung dieses Auftrags verarbeitet."),

  ueberschrift("6", "Bindefrist und Annahme"),
  body(`An dieses Angebot halten wir uns bis zum ${k.BINDEFRIST} gebunden. ` +
       "Die Annahme erfolgt durch Gegenzeichnung dieses Angebots oder durch " +
       "Bestätigung in Textform (E-Mail genügt). Mit der Annahme kommt ein " +
       `Dienstvertrag zwischen dem Auftraggeber und der ${STAMM.firma} zustande.`),

  ueberschrift("7", "Schlussbestimmungen"),
  body("Änderungen und Ergänzungen dieses Vertrags bedürfen der Textform. " +
       "Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der " +
       "übrigen Bestimmungen unberührt. Es gilt deutsches Recht. Ist der " +
       "Auftraggeber Kaufmann, ist Gerichtsstand Würzburg."),

  // Unterschriften
  abs(t("", {}), { vor: 500, nach: 0 }),
  new Table({
    width: { size: 9340, type: WidthType.DXA },
    columnWidths: [4470, 400, 4470],
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 4470, type: WidthType.DXA },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                     left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [
            new Paragraph({ spacing: { before: 700, after: 40 },
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: GRAPHIT } },
              children: [t("Ort, Datum", { pt: 8.5, farbe: GRAU })] }),
            abs(t(`${k.KUNDE_FIRMA}`, { pt: 10, fett: true }), { nach: 20 }),
            abs(t("(Auftraggeber)", { pt: 8.5, farbe: GRAU }), { nach: 0 }),
          ],
        }),
        new TableCell({
          width: { size: 400, type: WidthType.DXA },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                     left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph("")],
        }),
        new TableCell({
          width: { size: 4470, type: WidthType.DXA },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                     left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [
            new Paragraph({ spacing: { before: 700, after: 40 },
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: GRAPHIT } },
              children: [t(`Würzburg, ${k.DATUM}`, { pt: 8.5, farbe: GRAU })] }),
            abs(t(STAMM.firma, { pt: 10, fett: true }), { nach: 20 }),
            abs(t("Oliver Fieder, Geschäftsführer", { pt: 8.5, farbe: GRAU }), { nach: 0 }),
          ],
        }),
      ],
    })],
  }),
];

const doc = new Document({
  styles: { default: { document: { run: { font: DISPLAY, size: 22, color: GRAPHIT } } } },
  sections: [{
    properties: {
      page: {
        margin: { top: 1300, bottom: 1200, left: 1250, right: 1250 },
      },
    },
    headers: { default: kopf },
    footers: { default: fuss },
    children: inhalt,
  }],
});

const ziel = process.argv[2] || path.join(__dirname, "angebot-digital-check.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(ziel, buf);
  console.log("gespeichert:", ziel);
});
