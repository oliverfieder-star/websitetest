import { cn } from "@/lib/utils";

/**
 * Laufband der Büroaufgaben, die tagsüber miterledigt werden.
 * Pausiert bei Hover und Tastaturfokus; bei reduzierter Bewegung
 * steht es still (CSS in globals.css).
 */
export function Marquee({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  const row = [...items, ...items];
  return (
    <div
      className={cn(
        "marquee-wrap overflow-hidden border-y border-linie bg-flaeche py-5",
        className
      )}
      tabIndex={0}
      role="list"
      aria-label="Büroaufgaben, die automatisiert werden können"
    >
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
        {row.map((item, i) => (
          <span
            key={i}
            role={i < items.length ? "listitem" : undefined}
            aria-hidden={i >= items.length}
            className="flex items-center gap-10 font-display text-sm font-medium uppercase tracking-[0.2em] text-gedimmt"
          >
            {item}
            <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
}
