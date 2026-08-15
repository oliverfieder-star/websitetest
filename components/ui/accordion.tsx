"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccordionItem = {
  frage: string;
  antwort: React.ReactNode;
};

/** Schlichtes, tastaturfreundliches Akkordeon ohne Fremdabhängigkeit. */
export function Accordion({
  items,
  className,
}: {
  items: AccordionItem[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className={cn("divide-y divide-linie border-y border-linie", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${baseId}-panel-${i}`}
                id={`${baseId}-button-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left text-base font-semibold text-schrift transition-colors hover:text-amber md:text-lg"
              >
                {item.frage}
                <Plus
                  aria-hidden="true"
                  className={cn(
                    "h-5 w-5 flex-none text-amber transition-transform duration-300",
                    isOpen && "rotate-45"
                  )}
                />
              </button>
            </h3>
            <div
              id={`${baseId}-panel-${i}`}
              role="region"
              aria-labelledby={`${baseId}-button-${i}`}
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="max-w-2xl pb-7 leading-relaxed text-gedimmt">
                  {item.antwort}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
