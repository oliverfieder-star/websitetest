"use client";

import { useState } from "react";

/** Baut aus den Formularfeldern eine mailto-Nachricht. */
const EMAIL = "oliver@mainfranken-digital.de";

const feld =
  "w-full rounded-lg border border-linie bg-nacht px-4 py-3 text-schrift placeholder:text-gedimmt/60 focus:outline-3 focus:outline-stahl";

export function KontaktForm() {
  const [status, setStatus] = useState("");

  function absenden(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const daten = new FormData(form);
    const name = String(daten.get("name") ?? "").trim();
    const rueckruf = String(daten.get("rueckruf") ?? "").trim();

    if (!name || !rueckruf) {
      setStatus("Bitte Namen und eine Rückrufmöglichkeit angeben.");
      return;
    }
    const betrieb = String(daten.get("betrieb") ?? "").trim();
    const nachricht = String(daten.get("nachricht") ?? "").trim();
    const body = `Name: ${name}\nBetrieb: ${betrieb}\nRückruf: ${rueckruf}\n\n${nachricht}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      "Anfrage über mainfranken-digital"
    )}&body=${encodeURIComponent(body)}`;
    setStatus("Ihr E-Mail-Programm öffnet sich mit der Nachricht.");
  }

  return (
    <form onSubmit={absenden} noValidate className="grid gap-5">
      <div>
        <label htmlFor="f-name" className="mb-1.5 block text-sm font-semibold">
          Ihr Name
        </label>
        <input id="f-name" name="name" type="text" autoComplete="name" required className={feld} />
      </div>
      <div>
        <label htmlFor="f-betrieb" className="mb-1.5 block text-sm font-semibold">
          Betrieb <span className="font-normal text-gedimmt">(optional)</span>
        </label>
        <input id="f-betrieb" name="betrieb" type="text" autoComplete="organization" className={feld} />
      </div>
      <div>
        <label htmlFor="f-rueckruf" className="mb-1.5 block text-sm font-semibold">
          Telefon oder E-Mail für den Rückruf
        </label>
        <input id="f-rueckruf" name="rueckruf" type="text" autoComplete="tel" required className={feld} />
      </div>
      <div>
        <label htmlFor="f-nachricht" className="mb-1.5 block text-sm font-semibold">
          Worum geht es?{" "}
          <span className="font-normal text-gedimmt">(zwei Sätze genügen)</span>
        </label>
        <textarea id="f-nachricht" name="nachricht" rows={4} className={feld} />
      </div>
      <div>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-stahl px-8 py-4 text-base font-semibold text-tinte transition-transform hover:-translate-y-0.5 hover:bg-stahl-hell"
        >
          Nachricht senden
        </button>
      </div>
      <p role="status" className="min-h-6 text-sm font-semibold text-stahl">
        {status}
      </p>
      <p className="text-xs leading-relaxed text-gedimmt">
        Ihre Angaben werden nur zur Beantwortung Ihrer Anfrage verwendet.
        Details in der{" "}
        <a href="#datenschutz" className="underline underline-offset-2">
          Datenschutzerklärung
        </a>
        .
      </p>
    </form>
  );
}
