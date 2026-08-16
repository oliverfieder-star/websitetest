"use client";

/**
 * Der Werkfilm — das Herzstück der Seite: ein durchgescrollter
 * Arbeitstag. Ein Higgsfield-Master-Film (Nachmittag → goldene Stunde →
 * Dämmerung → Nacht → Licht aus) hängt am Scrollrad (Apple-Technik,
 * keyframe-dicht enkodiert, WebM zuerst + H.264-Fallback). Die Value
 * Proposition erscheint als Tafeln im Film; die Uhrzeit läuft mit und
 * springt im Finale auf 18:02 — mit uns geht das Licht früher aus.
 * Reduzierte Bewegung: Standbild-Sequenz statt Scrub.
 */

import { useEffect, useRef, useState } from "react";

type Tafel = {
  von: number;
  bis: number;
  pos: string;
  titel: React.ReactNode;
  sub?: string;
  cta?: boolean;
};

const TAFELN: Tafel[] = [
  {
    von: 0,
    bis: 0.13,
    pos: "Mainfranken Digital",
    titel: (
      <>
        KI und Digitalisierung für Ihren <i className="not-italic text-stahl">Handwerksbetrieb</i>.
      </>
    ),
    sub: "Scrollen Sie durch einen Arbeitstag — bis zum Feierabend.",
  },
  {
    von: 0.2,
    bis: 0.36,
    pos: "These 01",
    titel: (
      <>
        Weniger Zeit im <i className="not-italic text-stahl">Büro</i>.
      </>
    ),
    sub: "Angebote, Rechnungen und Stundenzettel laufen tagsüber automatisiert mit — während Ihr Betrieb arbeitet.",
  },
  {
    von: 0.42,
    bis: 0.58,
    pos: "These 02 — Förderung",
    titel: (
      <>
        Digitalbonus Bayern: bis zu <i className="not-italic text-stahl">50 %</i> erstattet.
      </>
    ),
    sub: "Bis zu 7.500 € Zuschuss für Ihr Digitalisierungsprojekt — den Antrag klären wir gemeinsam.",
  },
  {
    von: 0.66,
    bis: 0.8,
    pos: "21:15 Uhr — nur das Büro leuchtet noch",
    titel: (
      <>
        Damit auch das Büro endlich <i className="not-italic text-stahl">Feierabend</i> hat.
      </>
    ),
  },
  {
    von: 0.9,
    bis: 1,
    pos: "Feierabend",
    titel: (
      <>
        Jetzt ins <i className="not-italic text-stahl">Gespräch</i> kommen.
      </>
    ),
    sub: "Gemeinsam machen wir Ihre Prozesse effizienter.",
    cta: true,
  },
];

function uhrzeit(p: number) {
  if (p >= 0.9) return "18:02"; // die Pointe: Feierabend zur Feierabendzeit
  const start = 15.5 * 60;
  const ende = 21.75 * 60;
  const min = Math.round(start + (ende - start) * (p / 0.9));
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function Werkfilm() {
  const filmRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [statisch, setStatisch] = useState(false);
  const [p, setP] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStatisch(true);
      return;
    }
    let ziel = 0;
    let raf = 0;
    const beiScroll = () => {
      const el = filmRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      ziel = Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
    };
    const los = () => {
      const video = videoRef.current;
      if (video?.duration) {
        const t = ziel * video.duration;
        video.currentTime += (t - video.currentTime) * 0.22;
      }
      setP(ziel);
      raf = requestAnimationFrame(los);
    };
    addEventListener("scroll", beiScroll, { passive: true });
    beiScroll();
    raf = requestAnimationFrame(los);
    return () => {
      removeEventListener("scroll", beiScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (statisch) return <WerkfilmStatisch />;

  return (
    <section
      ref={filmRef}
      className="relative h-[680vh]"
      aria-label="Ein Arbeitstag in Ihrem Betrieb"
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          poster="/media/werkfilm-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/media/werkfilm-master.webm" type="video/webm" />
          <source src="/media/werkfilm-master.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-nacht/20 to-nacht/30" />

        {/* Uhrzeit-Stempel (Zeichensprache) */}
        <p
          aria-hidden="true"
          className={`absolute right-5 top-[5.2rem] z-10 rounded-sm border px-3.5 py-1.5 font-mono text-[13px] tracking-[0.18em] tabular-nums backdrop-blur-sm transition-colors md:right-12 ${
            p >= 0.9 ? "border-stahl text-stahl" : "border-linie text-schrift"
          } bg-nacht/55`}
        >
          {uhrzeit(p)}
        </p>

        {/* Tageslinie */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 z-10 h-[3px] bg-gradient-to-r from-[#e8c37a] via-[#c98a5a] to-[#22303f]"
          style={{ width: `${(p * 100).toFixed(2)}%` }}
        />

        {TAFELN.map((t, i) => {
          const an = p >= t.von && p <= t.bis;
          return (
            <div
              key={i}
              className={`pointer-events-none absolute inset-0 z-[5] grid place-items-center px-6 text-center transition-all duration-500 ${
                an ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              <div>
                <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.3em] text-stahl">
                  <span className="opacity-45">—— </span>
                  {t.pos}
                  <span className="opacity-45"> ——</span>
                </p>
                <h2 className="font-display mx-auto mt-4 max-w-[22ch] text-balance text-[clamp(1.9rem,5.2vw,4.2rem)] font-bold uppercase leading-[1.04] [text-shadow:0_2px_44px_rgba(0,0,0,0.75)]">
                  {t.titel}
                </h2>
                {t.sub && (
                  <p className="mx-auto mt-5 max-w-lg text-schrift/90 [text-shadow:0_1px_20px_rgba(0,0,0,0.8)]">
                    {t.sub}
                  </p>
                )}
                {t.cta && (
                  <div className="pointer-events-auto mt-9 flex flex-wrap items-center justify-center gap-5">
                    <a
                      href="#angebot"
                      className="rounded-sm bg-stahl px-8 py-4 text-sm font-bold uppercase tracking-wider text-tinte transition hover:-translate-y-0.5 hover:bg-stahl-hell"
                    >
                      Erstgespräch vereinbaren
                    </a>
                    <p className="text-sm text-gedimmt">
                      oder direkt anrufen:{" "}
                      <strong className="whitespace-nowrap text-schrift">
                        [PLATZHALTER Telefon]
                      </strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <p
          className={`absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gedimmt transition-opacity ${
            p > 0.04 ? "opacity-0" : "opacity-100"
          }`}
        >
          Scrollen
        </p>
      </div>
    </section>
  );
}

/** Standbild-Sequenz für reduzierte Bewegung. */
function WerkfilmStatisch() {
  const bloecke = [
    {
      bild: null,
      titel: "KI und Digitalisierung für Ihren Handwerksbetrieb.",
      text: null,
    },
    {
      bild: "/media/werkfilm-poster.jpg",
      alt: "Moderne Handwerkshalle am Nachmittag: Transporter, Hochregal, hinten ein verglastes Büro.",
      titel: "Weniger Zeit im Büro.",
      text: "Angebote, Rechnungen und Stundenzettel laufen tagsüber automatisiert mit. Digitalbonus Bayern: bis zu 50 % der Kosten erstattet, höchstens 7.500 €.",
    },
    {
      bild: "/media/werkfilm-ende.jpg",
      alt: "Das Bürolicht ist aus, die Halle liegt ruhig im Mondlicht.",
      titel: "Jetzt ins Gespräch kommen.",
      text: "Gemeinsam machen wir Ihre Prozesse effizienter.",
    },
  ];
  return (
    <section aria-label="Ein Arbeitstag in Ihrem Betrieb">
      {bloecke.map((b, i) => (
        <div key={i}>
          {b.bild && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.bild} alt={b.alt ?? ""} className="h-[70svh] w-full object-cover" />
          )}
          <div className="mx-auto max-w-3xl px-5 py-16 text-center">
            <h2 className="font-display text-3xl font-bold uppercase leading-tight md:text-4xl">
              {b.titel}
            </h2>
            {b.text && <p className="mt-4 text-gedimmt">{b.text}</p>}
          </div>
        </div>
      ))}
    </section>
  );
}

export default Werkfilm;
