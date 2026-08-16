"use client";

import { useState } from "react";

/**
 * Calendly-Inline-Widget mit Klick-Aktivierung: Der Kalender (und damit
 * die Datenübertragung an Calendly) lädt erst, wenn der Besucher ihn
 * aktiv anfordert — DSGVO-freundliche Zwei-Klick-Einbindung.
 */
const CALENDLY_URL =
  "https://calendly.com/oliver2004-fieder/30min?embed_type=Inline&hide_landing_page_details=1&hide_gdpr_banner=1&background_color=14171c&text_color=e9e7e2&primary_color=8fa9bd";

export function CalendlyBox() {
  const [geladen, setGeladen] = useState(false);

  return (
    <div
      className={`mt-6 flex-1 overflow-hidden rounded-sm border border-linie bg-flaeche ${
        geladen ? "" : "grid min-h-[460px] place-items-center p-6 text-center"
      }`}
    >
      {geladen ? (
        <iframe
          src={CALENDLY_URL}
          title="Termin buchen (Calendly)"
          loading="lazy"
          className="h-full min-h-[560px] w-full border-0"
        />
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setGeladen(true)}
            className="cursor-pointer rounded-sm bg-stahl px-8 py-4 text-sm font-bold uppercase tracking-wider text-tinte transition hover:-translate-y-0.5 hover:bg-stahl-hell"
          >
            Kalender anzeigen &amp; Termin buchen
          </button>
          <p className="mt-4 text-xs leading-relaxed text-gedimmt">
            Beim Laden des Kalenders werden Daten an Calendly (USA)
            übertragen. Details in der{" "}
            <a href="#datenschutz" className="underline underline-offset-2">
              Datenschutzerklärung
            </a>
            . Alternativ:{" "}
            <a
              href="https://calendly.com/oliver2004-fieder/30min"
              target="_blank"
              rel="noopener"
              className="underline underline-offset-2"
            >
              Calendly in neuem Fenster öffnen
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
