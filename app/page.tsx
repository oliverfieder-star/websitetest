import { Werkfilm } from "@/components/ui/werkfilm";
import { Accordion } from "@/components/ui/accordion";
import { Foerderrechner } from "@/components/foerderrechner";
import { KontaktForm } from "@/components/kontakt-form";
import { SiteHeader } from "@/components/site-header";
import { Reveal } from "@/components/reveal";
import { Phone } from "lucide-react";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-stahl">
      {children}
    </p>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display max-w-3xl text-balance text-3xl font-bold uppercase leading-[1.06] tracking-tight md:text-5xl">
      {children}
    </h2>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <Werkfilm />

        {/* ── Leistungen ────────────────────────────────────────── */}
        <section
          id="angebot"
          aria-labelledby="angebot-h"
          className="border-t border-linie bg-flaeche"
        >
          <div className="mx-auto max-w-6xl px-5 py-24 md:py-36">
            <Reveal>
              <Eyebrow>Das Angebot</Eyebrow>
              <H2>Zwei Wege, ein Ziel: ein ruhigeres Büro.</H2>
              <p className="mt-5 max-w-2xl text-gedimmt md:text-lg">
                Erst die gemeinsame Analyse, dann das geförderte Projekt —
                umgesetzt wird nur, was in Ihrem Alltag Zeit spart.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              <Reveal className="group relative overflow-hidden rounded-2xl border border-linie bg-nacht p-8 md:p-10">
                <h3 className="font-display text-xl font-bold uppercase tracking-tight">
                  Digital-Check
                </h3>
                <p className="font-display mt-4 text-4xl font-bold md:text-5xl">
                  1.900&nbsp;€{" "}
                  <span className="text-base font-medium text-gedimmt">
                    netto
                  </span>
                </p>
                <p className="mt-5 leading-relaxed text-gedimmt">
                  Die gemeinsame Analyse: ein Tag in Ihrem Betrieb. Wir gehen die
                  Büroarbeit zusammen durch — wo geht Zeit verloren, was lässt
                  sich automatisieren, was bleibt besser, wie es ist.
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
                    Ehrliche Empfehlung — auch wenn sie „nichts ändern“ heißt
                  </li>
                </ul>
              </Reveal>
              <Reveal
                delay={120}
                className="group relative overflow-hidden rounded-2xl border border-stahl/35 bg-nacht p-8 md:p-10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/praezision.jpg"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.16] transition-opacity duration-500 group-hover:opacity-25"
                />
                <div className="relative">
                  <h3 className="font-display text-xl font-bold uppercase tracking-tight">
                    Umsetzungsprojekt
                  </h3>
                  <p className="font-display mt-4 text-4xl font-bold md:text-5xl">
                    ab 15.000&nbsp;€
                  </p>
                  <p className="mt-3 inline-block rounded-full border border-stahl px-4 py-1.5 text-sm font-semibold text-stahl">
                    Digitalbonus Bayern: effektiv ab 7.500&nbsp;€
                  </p>
                  <p className="mt-5 leading-relaxed text-gedimmt">
                    Das größere Beratungs- und Umsetzungsprojekt: Die wichtigsten
                    Punkte aus dem Digital-Check werden eingerichtet — Angebote
                    schneller schreiben, Belege automatisch erfassen, Abläufe
                    automatisieren. Schritt für Schritt, während Ihr Betrieb
                    normal weiterläuft.
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
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Förderung ─────────────────────────────────────────── */}
        <section
          id="foerderung"
          aria-labelledby="foerderung-h"
          className="mx-auto max-w-6xl px-5 py-24 md:py-36"
        >
          <div className="grid items-start gap-12 md:grid-cols-[1fr_1.1fr]">
            <Reveal>
              <Eyebrow>Förderung</Eyebrow>
              <h2
                id="foerderung-h"
                className="font-display text-balance text-3xl font-bold uppercase leading-[1.06] tracking-tight md:text-5xl"
              >
                Der Staat übernimmt die Hälfte — bis{" "}
                <span className="text-stahl">7.500&nbsp;€</span>.
              </h2>
              <p className="mt-6 leading-relaxed text-gedimmt md:text-lg">
                Für Digitalisierungsprojekte wie dieses gibt es ein
                Förderprogramm ([PLATZHALTER: Programmname]): bezuschusst werden
                50&nbsp;Prozent des Projektvolumens, höchstens 7.500&nbsp;€.
                Voraussetzung ist ein Projektvolumen von mindestens
                4.000&nbsp;€. Rechnen Sie selbst.
              </p>
              <p className="mt-6 text-sm leading-relaxed text-gedimmt">
                Angaben ohne Gewähr; maßgeblich sind die Bedingungen des
                Förderprogramms ([PLATZHALTER: Programmname und Link]). Ob Ihr
                Betrieb die Voraussetzungen erfüllt und wie der Antrag läuft,
                klären wir im Erstgespräch.
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
          <div className="mx-auto max-w-6xl px-5 py-24 md:py-36">
            <Reveal>
              <Eyebrow>So läuft es ab</Eyebrow>
              <H2>Vier Schritte zu ruhigeren Abenden.</H2>
            </Reveal>
            <ol className="mt-14 grid gap-6 md:grid-cols-4">
              {[
                {
                  t: "Erstgespräch",
                  d: "Eine halbe Stunde am Telefon. Sie erzählen, wo es klemmt — ich sage Ihnen offen, ob und wie ich helfen kann. Kostet nichts und verpflichtet zu nichts.",
                },
                {
                  t: "Digital-Check",
                  d: "Ein Tag vor Ort in Ihrem Betrieb. Danach haben Sie schwarz auf weiß, was sich bei Ihnen lohnt, was es kostet und was es bringt.",
                },
                {
                  t: "Umsetzung",
                  d: "Die Abläufe werden eingerichtet und so lange angepasst, bis sie in Ihren Alltag passen. Förderung und Antrag klären wir vorher gemeinsam.",
                },
                {
                  t: "Alltag",
                  d: "Ihr Büro erledigt tagsüber, was bisher am Abend hängen blieb. Ich bleibe erreichbar, wenn etwas hakt.",
                },
              ].map((step, i) => (
                <Reveal key={step.t} delay={i * 100}>
                  <li className="h-full rounded-2xl border border-linie bg-nacht p-7">
                    <span
                      aria-hidden="true"
                      className="font-display text-5xl font-bold text-stahl/90"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display mt-4 text-lg font-bold uppercase tracking-tight">
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

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section
          id="fragen"
          aria-labelledby="fragen-h"
          className="mx-auto max-w-4xl px-5 py-24 md:py-36"
        >
          <Reveal>
            <Eyebrow>Häufige Fragen</Eyebrow>
            <H2>Klare Antworten, bevor Sie anrufen.</H2>
          </Reveal>
          <Reveal className="mt-12">
            <Accordion
              items={[
                {
                  frage: "Muss ich mich mit KI auskennen?",
                  antwort:
                    "Nein. Sie müssen Ihren Betrieb kennen — den Rest übernehme ich. Alles wird so eingerichtet, dass Sie und Ihr Büro es ohne Vorkenntnisse bedienen können, und so lange erklärt, bis es sitzt.",
                },
                {
                  frage:
                    "Wir haben schon Software, die keiner benutzt. Warum sollte das diesmal anders sein?",
                  antwort:
                    "Weil zuerst der Ablauf kommt und dann das Werkzeug. Im Digital-Check schaue ich mir an, wie bei Ihnen tatsächlich gearbeitet wird — geändert wird nur, was spürbar Zeit spart. Was nicht zu Ihrem Betrieb passt, wird auch nicht angeschafft.",
                },
                {
                  frage: "Was passiert mit unseren Daten?",
                  antwort:
                    "Ihre Daten bleiben Ihre Daten. Welche Werkzeuge welche Daten verarbeiten, legen wir vorab gemeinsam fest und halten es schriftlich fest. Details: [PLATZHALTER: Datenschutzhinweise].",
                },
                {
                  frage: "Wie viel Zeit kostet mich das neben dem Tagesgeschäft?",
                  antwort:
                    "Der Digital-Check ist ein Tag. In der Umsetzung brauche ich Sie punktuell — für Entscheidungen und die Einweisung. Geplant wird um Ihren Betriebsalltag herum, nicht umgekehrt.",
                },
                {
                  frage: "Wie funktioniert der Digitalbonus Bayern?",
                  antwort:
                    "Der Freistaat bezuschusst Digitalisierungsprojekte von Handwerks- und Gewerbebetrieben mit 50 Prozent des Projektvolumens, höchstens 7.500 €; das Projekt muss mindestens 4.000 € umfassen. Antrag und Voraussetzungen klären wir gemeinsam im Erstgespräch — ohne Gewähr, maßgeblich sind die aktuellen Programmbedingungen.",
                },
                {
                  frage: "Was kostet es am Ende wirklich?",
                  antwort:
                    "Der Digital-Check kostet 1.900 € netto. Ein Umsetzungsprojekt beginnt bei 15.000 €; mit Förderung liegt Ihr Anteil bei ab 7.500 €. Alle Kosten stehen im Angebot, bevor Sie sich entscheiden — Überraschungen gibt es keine.",
                },
              ]}
            />
          </Reveal>
        </section>

        {/* ── Kontakt ───────────────────────────────────────────── */}
        <section
          id="kontakt"
          aria-labelledby="kontakt-h"
          className="border-t border-linie bg-flaeche"
        >
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 md:grid-cols-2 md:py-36">
            <Reveal>
              <Eyebrow>Kontakt</Eyebrow>
              <h2
                id="kontakt-h"
                className="font-display text-balance text-3xl font-bold uppercase leading-[1.06] tracking-tight md:text-5xl"
              >
                Der nächste Schritt ist ein <span className="text-stahl">Anruf</span>.
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-gedimmt md:text-lg">
                Eine halbe Stunde, unverbindlich. Danach wissen Sie, ob sich das
                für Ihren Betrieb lohnt.
              </p>
              <p className="font-display mt-8 flex items-center gap-3 text-2xl font-bold text-stahl md:text-4xl">
                <Phone className="h-7 w-7" aria-hidden="true" />
                [PLATZHALTER Telefon]
              </p>
              <div className="mt-6 space-y-1.5 text-sm text-gedimmt">
                <p>Erreichbar: [PLATZHALTER: Zeiten]</p>
                <p>E-Mail: [PLATZHALTER: E-Mail-Adresse]</p>
                <p>Mainfranken Digital, [PLATZHALTER: Ort]</p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <KontaktForm />
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-linie">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-10 gap-y-3 px-5 py-10">
          <p className="font-display font-bold">
            Mainfranken<span className="text-stahl"> Digital</span>
          </p>
          <p className="text-sm text-gedimmt">
            Telefon: [PLATZHALTER Telefon] · [PLATZHALTER: E-Mail]
          </p>
          <div className="ml-auto flex gap-8 text-sm">
            <a href="#kontakt" className="text-gedimmt hover:text-stahl">
              Impressum [PLATZHALTER]
            </a>
            <a href="#kontakt" className="text-gedimmt hover:text-stahl">
              Datenschutz [PLATZHALTER]
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
