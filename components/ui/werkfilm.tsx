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
  posGross?: boolean;
  titel: React.ReactNode;
  sub?: string;
  cta?: boolean;
};

const TAFELN: Tafel[] = [
  {
    von: 0,
    bis: 0.13,
    pos: "Mainfranken Digital",
    posGross: true,
    titel: (
      <>
        KI und Digitalisierung für Ihren <i className="not-italic text-stahl">Handwerksbetrieb</i>.
      </>
    ),
    sub: "Wir digitalisieren Büro und Verwaltung in Handwerksbetrieben. Von der ersten Analyse bis zur fertigen Umsetzung.",
  },
  {
    von: 0.2,
    bis: 0.36,
    pos: "Digitalisierung & KI",
    titel: (
      <>
        Weniger Zeit für <i className="not-italic text-stahl">Büro und Verwaltung</i>.
      </>
    ),
    sub: "Durch Digitalisierung und den Einsatz künstlicher Intelligenz gestalten wir Ihre Abläufe effizienter. Beratung und Umsetzung aus einer Hand.",
  },
  {
    von: 0.42,
    bis: 0.58,
    pos: "Förderung",
    titel: (
      <>
        Bis zu <i className="not-italic text-stahl">50 %</i> der Kosten erstattet bekommen.
      </>
    ),
    sub: "Bis zu 7.500 € Zuschuss über den Digitalbonus Bayern für unser gemeinsames Projekt.",
  },
  {
    von: 0.66,
    bis: 0.8,
    pos: "Nur das Büro leuchtet noch",
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
              {/* Scrim: hält die Tafel auch über hellen Bildstellen lesbar */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(ellipse_62%_52%_at_50%_50%,rgba(9,11,14,0.78),rgba(9,11,14,0.42)_55%,transparent_78%)]"
              />
              <div className="relative">
                {t.posGross ? (
                  <p className="font-mono text-[clamp(0.95rem,1.6vw,1.25rem)] font-medium uppercase tracking-[0.3em] text-schrift">
                    Mainfranken<span className="text-stahl"> Digital</span>
                  </p>
                ) : (
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-stahl">
                    {t.pos}
                  </p>
                )}
                <h2 className="font-display mx-auto mt-4 max-w-[20ch] text-balance text-[clamp(1.9rem,5.2vw,4.2rem)] font-bold uppercase leading-[1.05] [text-shadow:0_2px_22px_rgba(0,0,0,0.95),0_2px_60px_rgba(0,0,0,0.85)]">
                  {t.titel}
                </h2>
                {t.sub && (
                  <p className="mx-auto mt-5 max-w-xl text-[1.08rem] text-[#f4f2ee] [text-shadow:0_1px_14px_rgba(0,0,0,0.95),0_1px_40px_rgba(0,0,0,0.9)]">
                    {t.sub}
                  </p>
                )}
                {t.cta && (
                  <div className="pointer-events-auto mt-9">
                    <a
                      href="https://calendly.com/oliver2004-fieder/30min"
                      target="_blank"
                      rel="noopener"
                      className="inline-block rounded-sm bg-stahl px-9 py-4 text-sm font-bold uppercase tracking-wider text-tinte shadow-[0_14px_44px_-14px_rgba(143,169,189,0.55)] transition hover:-translate-y-0.5 hover:bg-stahl-hell"
                    >
                      Gespräch vereinbaren
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity ${
            p > 0.03 ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="relative h-[42px] w-[26px] rounded-[14px] border-2 border-schrift/95">
            <span className="scrollrad absolute left-1/2 top-[7px] h-[9px] w-[4px] -translate-x-1/2 rounded-sm bg-stahl" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-schrift [text-shadow:0_1px_10px_rgba(0,0,0,0.9)]">
            Scrollen, um zu starten
          </span>
        </div>
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
