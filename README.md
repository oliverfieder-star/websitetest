# Mainfranken Digital — Website

Landingpage für Mainfranken Digital: eine Ein-Personen-Beratung, die
Handwerksbetrieben in Bayern Büroabläufe mit KI und Automatisierung abnimmt.

**Stack:** Next.js (App Router, statischer Export) · TypeScript · Tailwind CSS v4
· shadcn-Projektstruktur · three.js (WebGPU/TSL) über React Three Fiber ·
Bildmaterial generiert mit Higgsfield (Cinema Studio 2.5 + Nano Banana Tiefenkarte).

## Entwickeln

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # statischer Export nach out/
```

## Design: „Werkfilm"

Das Herzstück ist der **Werkfilm** (`components/ui/werkfilm.tsx`): ein
durchgescrollter Arbeitstag in einer modernen Handwerkshalle (Higgsfield-
generiert als Keyframe-Kette + Videosegmente mit Start-/Endbild, vom
GitHub-Runner zu einem keyframe-dicht enkodierten Master-Film montiert —
`.github/workflows/build-werkfilm.yml`). Scrollen = Zeit: Nachmittag →
Dämmerung → Nacht; am Ende geht im Glasbüro das Licht aus, die Uhr springt
auf 18:02, dann kommt der CTA. Value-Proposition-Tafeln liegen im Film;
reduzierte Bewegung erhält eine Standbild-Sequenz.

Einzeldatei-Fassung der Seite: `node design/build-teaser.mjs` →
`design/dist/werkfilm-seite.html`.

## Fachlich fix

- **Förderrechner** (`components/foerderrechner.tsx`):
  `zuschuss = min(volumen × 0,5, 7500)` — Deckelung ist Pflicht;
  `eigenanteil = volumen − zuschuss`; Eingabe 4.000–60.000 €, Standard
  15.000 €. Unter 4.000 € keine Förderung, daher beginnt der Regler dort.
- **Preise:** Digital-Check 1.900 € netto; Umsetzungsprojekt ab 15.000 €,
  effektiv ab 7.500 € nach Förderung.
- **Nichts erfunden:** keine Kundennamen, Referenzen, Erfahrungsjahre,
  Erfolgsquoten, Testimonials.

