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

## Design: „Werklicht"

Cinematisches Dunkel (Graphit mit Blauanteil), ein warmes Amber als einzige
laute Farbe, große kompakte Display-Typografie (Space Grotesk) mit ruhiger
Grotesk für den Fließtext (Inter, beide via `next/font` selbst gehostet).

Der Hero adaptiert die 21st.dev-Komponente „hero-futuristic": Ein von
Higgsfield generiertes Handwerksmotiv wird über seine Tiefenkarte von einer
Amber-Scanlinie und einem Punktraster „gelesen" — die KI liest das Handwerk,
sie ersetzt es nicht. Details:

- `components/ui/hero-futuristic.tsx` — WebGPU-Renderer mit automatischem
  WebGL2-Fallback (`forceWebGL`, wenn `navigator.gpu` fehlt). Bei
  `prefers-reduced-motion` oder ohne 3D-Kontext rendert ein Standbild mit
  CSS-Scanlinie. Texturen: `public/images/hero.jpg` + `hero-depth.jpg`.
- Wortweiser Titel-Reveal, Marquee der Büroaufgaben (pausiert bei Hover,
  Fokus und reduzierter Bewegung), Scroll-Reveals über IntersectionObserver.

## Projektstruktur (shadcn-Konvention)

```
app/                  Layout, Seite, globale Styles (Tailwind v4 @theme)
components/ui/        wiederverwendbare UI-Bausteine (hero-futuristic,
                      accordion, marquee) — Standardpfad der shadcn CLI;
                      `npx shadcn@latest add <komponente>` legt neue
                      Komponenten genau hier ab
components/           seitenspezifische Bausteine (Header, Rechner, Formular)
lib/utils.ts          cn()-Helfer (clsx + tailwind-merge)
components.json       shadcn-CLI-Konfiguration (Aliase @/components, @/lib)
public/images/        Higgsfield-Assets (JPEG-optimiert)
.github/workflows/    fetch-assets.yml — lädt neue Higgsfield-Generierungen
                      in den Branch (die Build-Umgebung erreicht den CDN nicht)
```

## Fachlich fix

- **Förderrechner** (`components/foerderrechner.tsx`):
  `zuschuss = min(volumen × 0,5, 7500)` — Deckelung ist Pflicht;
  `eigenanteil = volumen − zuschuss`; Eingabe 4.000–60.000 €, Standard
  15.000 €. Unter 4.000 € keine Förderung, daher beginnt der Regler dort.
- **Preise:** Digital-Check 1.900 € netto; Umsetzungsprojekt ab 15.000 €,
  effektiv ab 7.500 € nach Förderung.
- **Nichts erfunden:** keine Kundennamen, Referenzen, Erfahrungsjahre,
  Erfolgsquoten, Testimonials.

## Platzhalter (vor Veröffentlichung ersetzen)

Suche nach `PLATZHALTER`:

- **Telefonnummer** — Header, Hero, Kontakt, Footer (danach als `tel:`-Links verdrahten)
- **E-Mail** — Kontakt, Footer und Konstante `EMAIL` in
  `components/kontakt-form.tsx` (solange der Platzhalter drinsteht, verweist
  das Formular ehrlich aufs Telefon)
- **Förderprogramm** — Name und Link (Fördersektion, zweimal)
- **Erreichbarkeit, Ort, Impressum, Datenschutz**

Die deutschen Texte sind Entwurfsfassungen und werden wörtlich durch die
gelieferten Endtexte ersetzt.

## Einzeldatei-Vorschau

```bash
node scripts/build-preview.mjs   # -> preview/mainfranken-digital.html (~2 MB)
```

Bündelt den Standalone-Hero (three.js) und bettet Bilder und Schrift als
Data-URIs ein — eine Datei, direkt im Browser zu öffnen, läuft offline.
Quelle der Wahrheit bleibt die Next.js-App; die Vorschau wird aus ihr gebaut.
