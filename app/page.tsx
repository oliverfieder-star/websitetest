import { Werkfilm } from "@/components/ui/werkfilm";
import { Accordion } from "@/components/ui/accordion";
import { Foerderrechner } from "@/components/foerderrechner";
import { KontaktForm } from "@/components/kontakt-form";
import { SiteHeader } from "@/components/site-header";
import { Reveal } from "@/components/reveal";
import { Phone } from "lucide-react";
import { CalendlyBox } from "@/components/calendly-box";
import { Rechtstexte } from "@/components/rechtstexte";

/** Maßketten-Trenner (Zeichensprache) */
function Trenner({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden="true" className="mb-12 flex items-center gap-5">
      <span className="relative h-px flex-1 bg-linie before:absolute before:-top-1 before:left-0 before:h-[9px] before:w-px before:bg-linie after:absolute after:-top-1 after:right-0 after:h-[9px] after:w-px after:bg-linie" />
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-stahl">
        {children}
      </span>
      <span className="relative h-px flex-1 bg-linie before:absolute before:-top-1 before:left-0 before:h-[9px] before:w-px before:bg-linie after:absolute after:-top-1 after:right-0 after:h-[9px] after:w-px after:bg-linie" />
    </div>
  );
}

function H2({
  children,
  einzeilig,
  id,
}: {
  children: React.ReactNode;
  einzeilig?: boolean;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className={`font-display max-w-4xl text-2xl font-bold uppercase leading-[1.1] tracking-tight md:text-4xl ${
        einzeilig ? "xl:whitespace-nowrap" : ""
      }`}
    >
      {children}
    </h2>
  );
}

const CALENDLY = "https://calendly.com/oliver2004-fieder/30min";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <Werkfilm />

        {/* ── Angebot ───────────────────────────────────────────── */}
        <section
          id="angebot"
          aria-labelledby="angebot-h"
          className="border-t border-linie bg-flaeche"
        >
          <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
            <Reveal>
              <Trenner>Leistungen</Trenner>
              <H2 id="angebot-h">
                Unsere Dienstleistungen:{" "}
                <span className="text-stahl">
                  Künstliche Intelligenz und Digitalisierung
                </span>
                .
              </H2>
              <p className="mt-5 max-w-2xl text-justify text-gedimmt [hyphens:auto] md:text-lg">
                Typischerweise starten wir mit dem Digital-Check: der
                gemeinsamen Analyse Ihrer Abläufe. Danach folgt das
                Umsetzungsprojekt. Wir beraten nicht nur, wir setzen auch um
                und bleiben, bis alles im Alltag läuft.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              <Reveal className="relative overflow-hidden rounded-md border border-linie bg-nacht p-8 md:p-10">
                <p className="font-mono text-[11.5px] tracking-[0.2em] text-stahl">
                  SCHRITT 1 · DER EINSTIEG
                </p>
                <h3 className="font-display mt-3 text-xl font-bold uppercase tracking-tight">
                  Digital-Check
                </h3>
                <p className="font-display mt-4 text-4xl font-bold md:text-5xl">
                  1.900&nbsp;€{" "}
                  <span className="text-base font-medium text-gedimmt">
                    netto
                  </span>
                </p>
                <p className="mt-5 text-justify leading-relaxed text-gedimmt [hyphens:auto]">
                  Die gemeinsame Analyse: ein Tag in Ihrem Betrieb. Wir gehen
                  die Büro- und Verwaltungsarbeit zusammen durch: Wo geht Zeit
                  verloren, was lässt sich automatisieren, was bleibt besser,
                  wie es ist.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-gedimmt">
                  <li className="flex gap-3">
                    <span className="mt-2.5 h-px w-4 flex-none bg-stahl" />
                    Vor Ort, an Ihren echten Abläufen
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2.5 h-px w-4 flex-none bg-stahl" />
                    Schriftlicher Maßnahmenplan mit Prioritäten
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2.5 h-px w-4 flex-none bg-stahl" />
                    Ehrliche Empfehlung, auch wenn sie „nichts ändern“ heißt
                  </li>
                </ul>
              </Reveal>
              <Reveal
                delay={120}
                className="relative overflow-hidden rounded-md border border-stahl/40 bg-nacht p-8 md:p-10"
              >
                <p className="font-mono text-[11.5px] tracking-[0.2em] text-stahl">
                  SCHRITT 2 · DAS PROJEKT
                </p>
                <h3 className="font-display mt-3 text-xl font-bold uppercase tracking-tight">
                  Umsetzungsprojekt
                </h3>
                <p className="font-display mt-4 text-4xl font-bold md:text-5xl">
                  ab 10.000&nbsp;€
                </p>
                <p className="mt-3 inline-block -rotate-1 rounded-sm border-[1.5px] border-stahl px-3 py-1.5 font-mono text-xs font-semibold text-stahl">
                  DIGITALBONUS BAYERN: bis zu 50 % gefördert
                </p>
                <p className="mt-5 text-justify leading-relaxed text-gedimmt [hyphens:auto]">
                  Beratung und Umsetzung aus einer Hand: Die wichtigsten Punkte
                  aus dem Digital-Check werden eingerichtet, von der
                  schnelleren Angebotserstellung bis zur automatischen
                  Belegerfassung. Ein typisches Projekt liegt bei
                  15.000&nbsp;€, effektiv 7.500&nbsp;€ nach Förderung.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-gedimmt">
                  <li className="flex gap-3">
                    <span className="mt-2.5 h-px w-4 flex-none bg-stahl" />
                    Einrichtung und Anpassung an Ihre Arbeitsweise
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2.5 h-px w-4 flex-none bg-stahl" />
                    Einweisung für Sie und Ihr Büro
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2.5 h-px w-4 flex-none bg-stahl" />
                    Begleitung, bis es im Alltag läuft
                  </li>
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Förderung ─────────────────────────────────────────── */}
        <section
          id="foerderung"
          aria-labelledby="foerderung-h"
          className="mx-auto max-w-6xl px-5 py-24 md:py-32"
        >
          <div className="grid items-start gap-12 md:grid-cols-[1fr_1.1fr]">
            <Reveal>
              <Trenner>Förderung</Trenner>
              <H2 id="foerderung-h">
                Der Digitalbonus Bayern übernimmt bis zu{" "}
                <span className="text-stahl">50&nbsp;%</span>.
              </H2>
              <p className="mt-6 text-justify leading-relaxed text-gedimmt [hyphens:auto] md:text-lg">
                Für Digitalisierungsprojekte wie dieses gibt es den{" "}
                <a
                  href="https://www.digitalbonus.bayern.de/"
                  target="_blank"
                  rel="noopener"
                  className="text-stahl underline underline-offset-4"
                >
                  Digitalbonus Bayern
                </a>
                : bezuschusst werden 50&nbsp;Prozent des Projektvolumens,
                höchstens 7.500&nbsp;€. Voraussetzung ist ein Projektvolumen
                von mindestens 4.000&nbsp;€. Rechnen Sie selbst.
              </p>
              <p className="mt-6 max-w-xl text-justify text-sm leading-relaxed text-gedimmt [hyphens:auto]">
                Angaben ohne Gewähr; maßgeblich sind die aktuellen Bedingungen
                unter{" "}
                <a
                  href="https://www.digitalbonus.bayern.de/"
                  target="_blank"
                  rel="noopener"
                  className="text-stahl underline underline-offset-4"
                >
                  digitalbonus.bayern.de
                </a>
                . Ob Ihr Betrieb die Voraussetzungen erfüllt und wie der Antrag
                läuft, klären wir im Erstgespräch.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <Foerderrechner />
            </Reveal>
          </div>
        </section>

        {/* ── Ablauf ────────────────────────────────────────────── */}
        <section
          id="ablauf"
          aria-labelledby="ablauf-h"
          className="border-t border-linie bg-flaeche"
        >
          <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
            <Reveal>
              <Trenner>So läuft es ab</Trenner>
              <H2 id="ablauf-h" einzeilig>
                Vier Schritte zu <span className="text-stahl">ruhigeren Abenden</span>.
              </H2>
            </Reveal>
            <ol className="mt-14 grid gap-6 md:grid-cols-4">
              {[
                {
                  t: "Erstgespräch",
                  d: "Eine halbe Stunde, wie es Ihnen passt. Sie erzählen, wo es klemmt. Ich sage Ihnen offen, ob und wie ich helfen kann. Kostet nichts und verpflichtet zu nichts.",
                },
                {
                  t: "Digital-Check",
                  d: "Ein Tag vor Ort in Ihrem Betrieb. Danach haben Sie schwarz auf weiß, was sich bei Ihnen lohnt, was es kostet und was es bringt.",
                },
                {
                  t: "Umsetzung",
                  d: "Die Abläufe werden eingerichtet und so lange angepasst, bis sie in Ihren Alltag passen. Digitalbonus und Antrag klären wir vorher gemeinsam.",
                },
                {
                  t: "Alltag",
                  d: "Ihr Büro erledigt tagsüber, was bisher am Abend hängen blieb. Ich bleibe erreichbar, wenn etwas hakt.",
                },
              ].map((step, i) => (
                <Reveal key={step.t} delay={i * 100}>
                  <li className="h-full rounded-md border border-linie bg-nacht p-7">
                    <span
                      aria-hidden="true"
                      className="font-mono text-4xl font-bold text-stahl"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display mt-4 text-base font-bold uppercase tracking-tight">
                      {step.t}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-gedimmt">
                      {step.d}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Kontakt ───────────────────────────────────────────── */}
        <section
          id="kontakt"
          aria-labelledby="kontakt-h"
          className="mx-auto max-w-6xl px-5 py-24 md:py-32"
        >
          <Reveal>
            <Trenner>Kontakt</Trenner>
            <H2 id="kontakt-h" einzeilig>
              Der nächste Schritt ist ein <span className="text-stahl">Gespräch</span>.
            </H2>
          </Reveal>
          {/* Personen-Band: Porträt, Erfahrung, Erreichbarkeit */}
          <Reveal className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5 rounded-md border border-stahl/40 bg-nacht px-6 py-5 md:px-8">
            <img
              src="/media/oliver-portraet.jpg"
              alt="Porträt von Oliver Fieder"
              width={96}
              height={96}
              className="h-24 w-24 flex-none rounded-full border-[1.5px] border-stahl object-cover"
            />
            <div className="min-w-60 flex-1 basis-72">
              <p className="text-lg font-bold">Oliver Fieder</p>
              <p className="text-sm text-gedimmt">
                Gründer und Berater, Mainfranken Digital
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gedimmt">
                Selbstständig seit dem 15. Lebensjahr, über sechs Jahre
                Unternehmer, seit rund drei Jahren in der Beratung, in
                Projekten unter anderem mit Kunden wie Siemens.
              </p>
            </div>
            <div className="space-y-1.5 text-sm text-gedimmt">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-stahl" aria-hidden="true" />
                <a
                  href="tel:+491792137476"
                  className="font-semibold text-schrift hover:text-stahl"
                >
                  0179 213 74 76
                </a>
              </p>
              <p>
                <a href="mailto:oliver@mainfranken-digital.de" className="text-schrift hover:text-stahl">
                  oliver@mainfranken-digital.de
                </a>
              </p>
              <p>Versbacher Straße 20 · 97078 Würzburg</p>
            </div>
          </Reveal>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[7fr_5fr]">
            <Reveal className="rounded-md border border-linie bg-nacht p-6 md:p-7">
              <p className="text-lg font-bold">Termin direkt buchen</p>
              <p className="mt-2 text-sm leading-relaxed text-gedimmt">
                Eine halbe Stunde, unverbindlich. Danach wissen Sie, ob sich
                Digitalisierung und KI für Ihren Betrieb lohnen und was der
                sinnvolle erste Schritt wäre.
              </p>
              <CalendlyBox />
            </Reveal>
            <Reveal delay={120} className="rounded-md border border-linie bg-nacht p-6 md:p-7">
              <p className="text-lg font-bold">Oder schreiben Sie kurz</p>
              <div className="mt-4">
                <KontaktForm />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section
          id="fragen"
          aria-labelledby="fragen-h"
          className="border-t border-linie bg-flaeche"
        >
          <div className="mx-auto max-w-4xl px-5 py-24 md:py-32">
            <Reveal>
              <Trenner>Häufige Fragen</Trenner>
              <H2 id="fragen-h" einzeilig>
                Klare Antworten, <span className="text-stahl">bevor Sie anrufen</span>.
              </H2>
            </Reveal>
            <Reveal className="mt-12">
              <Accordion
                items={[
                  {
                    frage: "Muss ich mich mit KI auskennen?",
                    antwort:
                      "Nein. Sie müssen Ihren Betrieb kennen, den Rest übernehme ich. Alles wird so eingerichtet, dass Sie und Ihr Büro es ohne Vorkenntnisse bedienen können, und so lange erklärt, bis es sitzt.",
                  },
                  {
                    frage:
                      "Wir haben schon Software, die keiner benutzt. Warum sollte das diesmal anders sein?",
                    antwort:
                      "Weil zuerst der Ablauf kommt und dann das Werkzeug. Im Digital-Check schaue ich mir an, wie bei Ihnen tatsächlich gearbeitet wird. Geändert wird nur, was spürbar Zeit spart. Was nicht zu Ihrem Betrieb passt, wird auch nicht angeschafft.",
                  },
                  {
                    frage: "Wie funktioniert der Digitalbonus Bayern?",
                    antwort:
                      "Der Freistaat bezuschusst Digitalisierungsprojekte von Handwerks- und Gewerbebetrieben mit 50 Prozent des Projektvolumens, höchstens 7.500 €; das Projekt muss mindestens 4.000 € umfassen. Antrag und Voraussetzungen klären wir gemeinsam im Erstgespräch. Ohne Gewähr; maßgeblich sind die aktuellen Bedingungen unter digitalbonus.bayern.de.",
                  },
                  {
                    frage: "Was passiert mit unseren Daten?",
                    antwort:
                      "Ihre Daten bleiben Ihre Daten. Welche Werkzeuge welche Daten verarbeiten, legen wir vorab gemeinsam fest und halten es schriftlich fest. Details stehen in der Datenschutzerklärung auf dieser Seite.",
                  },
                  {
                    frage:
                      "Wie viel Zeit kostet mich das neben dem Tagesgeschäft?",
                    antwort:
                      "Der Digital-Check ist ein Tag. In der Umsetzung brauche ich Sie punktuell, für Entscheidungen und die Einweisung. Geplant wird um Ihren Betriebsalltag herum, nicht umgekehrt.",
                  },
                  {
                    frage: "Was kostet es am Ende wirklich?",
                    antwort:
                      "Der Digital-Check kostet 1.900 € netto. Ein Umsetzungsprojekt beginnt bei 10.000 €; ein typisches Projekt liegt bei 15.000 €, mit Digitalbonus effektiv 7.500 €. Alle Kosten stehen im Angebot, bevor Sie sich entscheiden. Überraschungen gibt es keine.",
                  },
                ]}
              />
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-linie">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-10 gap-y-3 px-5 py-10">
          <p className="font-display font-bold uppercase tracking-wider">
            Mainfranken<span className="text-stahl"> Digital</span>
          </p>
          <p className="text-sm text-gedimmt">
            Oliver Fieder ·{" "}
            <a href="tel:+491792137476" className="hover:text-stahl">
              0179 213 74 76
            </a>{" "}
            ·{" "}
            <a href="mailto:oliver@mainfranken-digital.de" className="hover:text-stahl">
              oliver@mainfranken-digital.de
            </a>
          </p>
          <div className="ml-auto flex gap-8 text-sm">
            <a href="#impressum" className="text-gedimmt hover:text-stahl">
              Impressum
            </a>
            <a href="#datenschutz" className="text-gedimmt hover:text-stahl">
              Datenschutz
            </a>
          </div>
        </div>
        <Rechtstexte />
      </footer>
    </>
  );
}
