"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { Panel } from "./panel";

export type CollapsiblePanelProps = {
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  description: string;
  eyebrow: string;
  hint?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title: string;
};

const TOGGLE_CLASS =
  "inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-none border-2 border-[#1a1a1a]/20 bg-white text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]";

export function CollapsiblePanel({
  actions,
  children,
  defaultOpen = false,
  description,
  eyebrow,
  hint,
  onOpenChange,
  open,
  title,
}: CollapsiblePanelProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const baseId = useId();
  const regionId = `${baseId}-region`;
  const titleId = `${baseId}-title`;

  function setOpen(next: boolean) {
    if (open === undefined) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  }

  return (
    <Panel className="p-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45 bg-brand-yellow" />
            {eyebrow}
          </p>
          <h3
            className="mt-2 text-xl font-black uppercase tracking-tight text-[#1a1a1a]"
            id={titleId}
          >
            {title}
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#231f20]/70">{description}</p>
          {hint ? (
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#231f20]/56">
              {hint}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
          {actions}
          <button
            aria-controls={regionId}
            aria-expanded={isOpen}
            className={TOGGLE_CLASS}
            onClick={() => setOpen(!isOpen)}
            type="button"
          >
            <span className="sr-only">{isOpen ? `Recolher ${title}` : `Expandir ${title}`}</span>
            <ChevronDown
              aria-hidden
              className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${
                isOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
        </div>
      </header>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div
          aria-labelledby={titleId}
          className="overflow-hidden"
          id={regionId}
          inert={!isOpen}
          role="region"
        >
          <div className="border-t-2 border-[#231f20]/10 pt-5">{children}</div>
        </div>
      </div>
    </Panel>
  );
}
