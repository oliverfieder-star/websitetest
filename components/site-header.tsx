import { Phone } from "lucide-react";

const NAV = [
  ["Leistungen", "#leistungen"],
  ["Förderung", "#foerderung"],
  ["Ablauf", "#ablauf"],
  ["Fragen", "#fragen"],
  ["Kontakt", "#kontakt"],
] as const;

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-linie bg-nacht/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-schrift"
        >
          Mainfranken<span className="text-amber"> Digital</span>
        </a>
        <nav aria-label="Bereiche der Seite" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV.map(([label, href]) => (
              <li key={href}>
                <a
                  href={href}
                  className="py-2 text-sm font-medium text-gedimmt transition-colors hover:text-amber"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href="#kontakt"
          title="Telefonnummer folgt — zur Kontaktsektion"
          className="ml-auto flex items-center gap-2 text-sm font-semibold text-schrift transition-colors hover:text-amber md:ml-0"
        >
          <Phone className="h-4 w-4 text-amber" aria-hidden="true" />
          <span className="hidden sm:inline">[PLATZHALTER Telefon]</span>
        </a>
      </div>
    </header>
  );
}
