import { Werkfilm } from "@/components/ui/werkfilm";
import { Accordion } from "@/components/ui/accordion";
import { Foerderrechner } from "@/components/foerderrechner";
import { KontaktForm } from "@/components/kontakt-form";
import { SiteHeader } from "@/components/site-header";
import { Reveal } from "@/components/reveal";
import { Phone } from "lucide-react";
import { CalendlyBox } from "@/components/calendly-box";

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
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal className="flex h-full flex-col rounded-md border border-stahl/40 bg-nacht p-8 md:p-10">
              <div className="flex items-center gap-4">
                <img
                  src="/media/oliver-portraet.jpg"
                  alt="Porträt von Oliver Fieder"
                  width={112}
                  height={112}
                  className="h-28 w-28 flex-none rounded-full border-[1.5px] border-stahl object-cover"
                />
                <div>
                  <p className="text-lg font-bold">Oliver Fieder</p>
                  <p className="text-sm text-gedimmt">
                    Gründer und Berater, Mainfranken Digital
                  </p>
                </div>
              </div>
              <p className="mt-6 text-justify leading-relaxed text-gedimmt [hyphens:auto]">
                Selbstständig seit dem 15. Lebensjahr, heute über sechs Jahre
                Unternehmer und seit rund drei Jahren in der Beratung tätig, in
                Projekten unter anderem mit Kunden wie Siemens.
              </p>
              <p className="mt-4 text-justify leading-relaxed text-gedimmt [hyphens:auto]">
                Eine halbe Stunde, unverbindlich. Danach wissen Sie, ob sich
                Digitalisierung und KI für Ihren Betrieb lohnen und was der
                sinnvolle erste Schritt wäre.
              </p>
              <CalendlyBox />
              <div className="mt-7 space-y-1.5 text-sm text-gedimmt">
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
                  E-Mail:{" "}
                  <a href="mailto:oliver@mainfranken-digital.de" className="text-schrift hover:text-stahl">
                    oliver@mainfranken-digital.de
                  </a>
                </p>
                <p>Mainfranken Digital · Versbacher Straße 20 · 97078 Würzburg</p>
              </div>
            </Reveal>
            <Reveal delay={120} className="flex h-full flex-col rounded-md border border-linie bg-nacht p-8 md:p-10">
              <p className="text-lg font-bold">Oder schreiben Sie kurz</p>
              <div className="mt-5">
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
        {/* ── Rechtliches ───────────────────────────────────────── */}
        <section aria-label="Rechtliches" className="mx-auto max-w-4xl px-5 py-20">
          <Trenner>Rechtliches</Trenner>
          <div className="divide-y divide-linie border-y border-linie text-sm leading-relaxed text-gedimmt">
            <details id="impressum" className="group">
              <summary className="cursor-pointer list-none py-5 text-base font-semibold text-schrift hover:text-stahl">
                Impressum
              </summary>
              <div className="max-w-2xl space-y-3 pb-6">
                <p className="font-semibold text-schrift">Angaben gemäß § 5 DDG</p>
                <p>
                  Fieder Handels GmbH
                  <br />
                  Versbacher Straße 20
                  <br />
                  97078 Würzburg
                </p>
                <p>
                  <span className="font-semibold text-schrift">Vertreten durch:</span>
                  <br />
                  Geschäftsführer Oliver Fieder
                </p>
                <p>
                  <span className="font-semibold text-schrift">Kontakt:</span>
                  <br />
                  Telefon: <a href="tel:+491792137476">0179 213 74 76</a>
                  <br />
                  E-Mail:{" "}
                  <a href="mailto:oliver@mainfranken-digital.de">
                    oliver@mainfranken-digital.de
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-schrift">Registereintrag:</span>
                  <br />
                  Eintragung im Handelsregister.
                  <br />
                  Registergericht: Amtsgericht Würzburg
                  <br />
                  Registernummer: HRB 17397
                </p>
                <p>
                  <span className="font-semibold text-schrift">Umsatzsteuer-ID:</span>
                  <br />
                  Umsatzsteuer-Identifikationsnummer gemäß § 27a
                  Umsatzsteuergesetz: DE3370133371
                </p>
                <p>
                  <span className="font-semibold text-schrift">
                    Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:
                  </span>
                  <br />
                  Oliver Fieder, Versbacher Straße 20, 97078 Würzburg
                </p>
                <p>„Mainfranken Digital“ ist ein Angebot der Fieder Handels GmbH.</p>
                <p>
                  <span className="font-semibold text-schrift">
                    Verbraucherstreitbeilegung:
                  </span>
                  <br />
                  Wir sind nicht bereit oder verpflichtet, an
                  Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </div>
            </details>
            <details id="datenschutz" className="group">
              <summary className="cursor-pointer list-none py-5 text-base font-semibold text-schrift hover:text-stahl">
                Datenschutzerklärung
              </summary>
              <div className="max-w-2xl space-y-3 pb-6 text-justify [hyphens:auto]">
                <p>
                  <span className="font-semibold text-schrift">1. Verantwortlicher</span>
                  <br />
                  Fieder Handels GmbH, Versbacher Straße 20, 97078 Würzburg,
                  Telefon: 0179 213 74 76, E-Mail: oliver@mainfranken-digital.de.
                </p>
                <p>
                  <span className="font-semibold text-schrift">
                    2. Hosting und Server-Logdateien
                  </span>
                  <br />
                  Beim Aufruf dieser Website verarbeitet der Hosting-Anbieter
                  automatisch technisch notwendige Daten (z. B. IP-Adresse, Datum
                  und Uhrzeit des Abrufs, aufgerufene Seite, Browsertyp), um die
                  Website auszuliefern und ihre Stabilität und Sicherheit zu
                  gewährleisten (Art. 6 Abs. 1 lit. f DSGVO). Die Logdaten werden
                  nach spätestens sieben Tagen gelöscht, soweit keine
                  sicherheitsrelevante Aufbewahrung erforderlich ist. Diese
                  Website setzt keine Cookies zu Analyse- oder Werbezwecken ein
                  und verwendet kein Tracking.
                </p>
                <p>
                  <span className="font-semibold text-schrift">3. Kontaktaufnahme</span>
                  <br />
                  Wenn Sie uns per Formular, E-Mail oder Telefon kontaktieren,
                  verarbeiten wir die von Ihnen mitgeteilten Daten (Name,
                  Betrieb, Kontaktdaten, Inhalt der Anfrage) ausschließlich zur
                  Bearbeitung Ihrer Anfrage und für Anschlussfragen (Art. 6
                  Abs. 1 lit. b DSGVO, bei allgemeinen Anfragen Art. 6 Abs. 1
                  lit. f DSGVO). Die Daten werden gelöscht, sobald sie für die
                  Bearbeitung nicht mehr erforderlich sind und keine
                  gesetzlichen Aufbewahrungspflichten entgegenstehen.
                </p>
                <p>
                  <span className="font-semibold text-schrift">
                    4. Terminbuchung über Calendly
                  </span>
                  <br />
                  Für die Online-Terminbuchung nutzen wir den Dienst Calendly
                  der Calendly LLC, 1315 Peachtree St NE, Atlanta, GA 30309,
                  USA. Der Kalender wird erst geladen, wenn Sie ihn aktiv
                  anklicken; erst dann werden Daten (u. a. IP-Adresse sowie die
                  von Ihnen eingegebenen Termindaten) an Calendly übertragen,
                  ggf. auch in die USA. Rechtsgrundlage ist Ihre Einwilligung
                  durch das aktive Laden (Art. 6 Abs. 1 lit. a DSGVO) sowie die
                  Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b
                  DSGVO). Calendly ist nach dem EU-U.S. Data Privacy Framework
                  zertifiziert. Details:{" "}
                  <a
                    href="https://calendly.com/privacy"
                    target="_blank"
                    rel="noopener"
                    className="text-stahl underline underline-offset-2"
                  >
                    calendly.com/privacy
                  </a>
                  .
                </p>
                <p>
                  <span className="font-semibold text-schrift">5. Ihre Rechte</span>
                  <br />
                  Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung
                  (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung
                  (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch
                  gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f
                  DSGVO (Art. 21). Eine erteilte Einwilligung können Sie
                  jederzeit mit Wirkung für die Zukunft widerrufen. Außerdem
                  haben Sie das Recht, sich bei einer
                  Datenschutz-Aufsichtsbehörde zu beschweren, z. B. beim
                  Bayerischen Landesamt für Datenschutzaufsicht (BayLDA),
                  Promenade 18, 91522 Ansbach.
                </p>
                <p>Stand: August 2026</p>
              </div>
            </details>
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
      </footer>
    </>
  );
}
