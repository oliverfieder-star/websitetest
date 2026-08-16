"use client";

import { useEffect } from "react";

/**
 * Impressum und Datenschutzerklärung, zusammengeklappt in der Fußzeile.
 * Die Fußzeilen-Links (#impressum / #datenschutz) klappen den jeweiligen
 * Text automatisch auf.
 */
export function Rechtstexte() {
  useEffect(() => {
    const oeffnen = () => {
      const id = window.location.hash.slice(1);
      if (id === "impressum" || id === "datenschutz") {
        const el = document.getElementById(id) as HTMLDetailsElement | null;
        if (el) el.open = true;
      }
    };
    oeffnen();
    window.addEventListener("hashchange", oeffnen);
    return () => window.removeEventListener("hashchange", oeffnen);
  }, []);

  return (
    <div className="mx-auto max-w-6xl divide-y divide-linie border-t border-linie px-5 text-sm leading-relaxed text-gedimmt">
      <details id="impressum" className="group">
        <summary className="cursor-pointer list-none py-4 font-semibold text-gedimmt hover:text-stahl">
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
            Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
            DE3370133371
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
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen.
          </p>
        </div>
      </details>
      <details id="datenschutz" className="group">
        <summary className="cursor-pointer list-none py-4 font-semibold text-gedimmt hover:text-stahl">
          Datenschutzerklärung
        </summary>
        <div className="max-w-2xl space-y-3 pb-6 text-justify [hyphens:auto]">
          <p>
            <span className="font-semibold text-schrift">1. Verantwortlicher</span>
            <br />
            Fieder Handels GmbH, Versbacher Straße 20, 97078 Würzburg, Telefon:
            0179 213 74 76, E-Mail: oliver@mainfranken-digital.de.
          </p>
          <p>
            <span className="font-semibold text-schrift">
              2. Hosting und Server-Logdateien
            </span>
            <br />
            Beim Aufruf dieser Website verarbeitet der Hosting-Anbieter
            automatisch technisch notwendige Daten (z. B. IP-Adresse, Datum und
            Uhrzeit des Abrufs, aufgerufene Seite, Browsertyp), um die Website
            auszuliefern und ihre Stabilität und Sicherheit zu gewährleisten
            (Art. 6 Abs. 1 lit. f DSGVO). Die Logdaten werden nach spätestens
            sieben Tagen gelöscht, soweit keine sicherheitsrelevante
            Aufbewahrung erforderlich ist. Diese Website setzt keine Cookies zu
            Analyse- oder Werbezwecken ein und verwendet kein Tracking.
          </p>
          <p>
            <span className="font-semibold text-schrift">3. Kontaktaufnahme</span>
            <br />
            Wenn Sie uns per Formular, E-Mail oder Telefon kontaktieren,
            verarbeiten wir die von Ihnen mitgeteilten Daten (Name, Betrieb,
            Kontaktdaten, Inhalt der Anfrage) ausschließlich zur Bearbeitung
            Ihrer Anfrage und für Anschlussfragen (Art. 6 Abs. 1 lit. b DSGVO,
            bei allgemeinen Anfragen Art. 6 Abs. 1 lit. f DSGVO). Die Daten
            werden gelöscht, sobald sie für die Bearbeitung nicht mehr
            erforderlich sind und keine gesetzlichen Aufbewahrungspflichten
            entgegenstehen.
          </p>
          <p>
            <span className="font-semibold text-schrift">
              4. Terminbuchung über Calendly
            </span>
            <br />
            Für die Online-Terminbuchung nutzen wir den Dienst Calendly der
            Calendly LLC, 1315 Peachtree St NE, Atlanta, GA 30309, USA. Der
            Kalender wird erst geladen, wenn Sie ihn aktiv anklicken; erst dann
            werden Daten (u. a. IP-Adresse sowie die von Ihnen eingegebenen
            Termindaten) an Calendly übertragen, ggf. auch in die USA.
            Rechtsgrundlage ist Ihre Einwilligung durch das aktive Laden
            (Art. 6 Abs. 1 lit. a DSGVO) sowie die Durchführung
            vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO). Calendly
            ist nach dem EU-U.S. Data Privacy Framework zertifiziert. Details:{" "}
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
            (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen
            Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
            (Art. 21). Eine erteilte Einwilligung können Sie jederzeit mit
            Wirkung für die Zukunft widerrufen. Außerdem haben Sie das Recht,
            sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, z. B.
            beim Bayerischen Landesamt für Datenschutzaufsicht (BayLDA),
            Promenade 18, 91522 Ansbach.
          </p>
          <p>Stand: August 2026</p>
        </div>
      </details>
    </div>
  );
}
