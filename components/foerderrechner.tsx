"use client";

import { useState } from "react";

/**
 * Förderrechner — fachlich fix:
 *   zuschuss = min(volumen × 0,5, 7500)   (Deckelung ist Pflicht)
 *   eigenanteil = volumen − zuschuss
 * Unter 4.000 € keine Förderung (Mindestgrenze des Programms),
 * daher beginnt der Regler bei 4.000 €.
 */

const MIN = 4000;
const MAX = 30000;
const STEP = 500;
const DECKEL = 7500;

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function Foerderrechner() {
  const [volumen, setVolumen] = useState(15000);

  const zuschuss = Math.min(volumen * 0.5, DECKEL);
  const eigenanteil = volumen - zuschuss;
  const anteil = (zuschuss / volumen) * 100;
  const fill = ((volumen - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="rounded-2xl border border-linie bg-flaeche p-7 md:p-10">
      <label
        htmlFor="volumen"
        className="text-sm font-semibold uppercase tracking-[0.15em] text-gedimmt"
      >
        Ihr Projektvolumen
      </label>
      <p className="font-display mt-2 text-4xl font-bold tabular-nums md:text-5xl">
        {euro.format(volumen)}
      </p>

      <input
        id="volumen"
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={volumen}
        onChange={(e) => setVolumen(Number(e.target.value))}
        aria-valuetext={`${euro.format(volumen)} Projektvolumen, ${euro.format(zuschuss)} Zuschuss`}
        aria-describedby="calc-hinweis"
        className="mt-6 h-11 w-full cursor-pointer appearance-none bg-transparent
          [&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-stahl
          [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-nacht [&::-moz-range-thumb]:bg-stahl
          [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-flaeche-2
          [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full
          [&::-webkit-slider-thumb]:-mt-3 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-nacht [&::-webkit-slider-thumb]:bg-stahl [&::-webkit-slider-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
        style={{
          // Verlaufsfüllung für die WebKit-Spur
          ["--fill" as string]: `${fill}%`,
          background: `linear-gradient(to right, var(--color-stahl) 0 ${fill}%, var(--color-flaeche-2) ${fill}% 100%)`,
          borderRadius: "999px",
          height: "6px",
          marginTop: "2rem",
          marginBottom: "0.5rem",
        }}
      />
      <div
        className="flex justify-between text-xs text-gedimmt"
        aria-hidden="true"
      >
        <span>{euro.format(MIN)}</span>
        <span>{euro.format(MAX)}</span>
      </div>

      <dl className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-stahl/40 bg-nacht p-5">
          <dt className="text-sm font-semibold text-stahl">Zuschuss</dt>
          <dd className="font-display mt-1 text-3xl font-bold tabular-nums text-schrift md:text-4xl">
            {euro.format(zuschuss)}
          </dd>
        </div>
        <div className="rounded-xl border border-linie bg-nacht p-5">
          <dt className="text-sm font-semibold text-gedimmt">Ihr Anteil</dt>
          <dd className="font-display mt-1 text-3xl font-bold tabular-nums text-schrift md:text-4xl">
            {euro.format(eigenanteil)}
          </dd>
        </div>
      </dl>

      <div
        className="mt-6 flex h-3 overflow-hidden rounded-full bg-flaeche-2"
        aria-hidden="true"
      >
        <div
          className="bg-stahl transition-[width] duration-200"
          style={{ width: `${anteil.toFixed(1)}%` }}
        />
      </div>

      <p id="calc-hinweis" className="mt-4 min-h-6 text-sm text-gedimmt">
        {volumen >= 15000
          ? `Der Höchstbetrag von ${euro.format(DECKEL)} ist erreicht.`
          : "Das sind 50 % Ihres Projektvolumens."}
      </p>
    </div>
  );
}
