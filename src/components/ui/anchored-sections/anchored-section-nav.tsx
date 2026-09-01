"use client";

import { useEffect, useRef, useState } from "react";

const SECTION_GAP = 12;

export type AnchoredSectionLink = {
  id: string;
  label: string;
};

export function AnchoredSectionNav({
  className = "",
  sections,
}: Readonly<{
  className?: string;
  sections: readonly AnchoredSectionLink[];
}>) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);
  const pinnedRef = useRef<string | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    const first = document.getElementById(sections[0]?.id ?? "");

    if (!nav || !first) return;

    const scroller = first.closest<HTMLElement>(".overflow-y-auto");
    const source: HTMLElement | Window = scroller ?? window;
    const offsetHost = scroller ?? document.documentElement;

    function stuckOffset() {
      const stickyTop = Number.parseFloat(window.getComputedStyle(nav!).top);

      return (Number.isFinite(stickyTop) ? stickyTop : 0) + nav!.offsetHeight;
    }

    function resolveActive() {
      const offset = stuckOffset();

      offsetHost.style.setProperty("--anchored-nav-offset", `${offset + SECTION_GAP}px`);

      if (pinnedRef.current) return;

      const atBottom = scroller
        ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4
        : window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;

      if (atBottom) {
        setActiveId(sections[sections.length - 1].id);
        return;
      }

      const bounds = scroller ? scroller.getBoundingClientRect() : null;
      const readingTop = (bounds ? bounds.top : 0) + offset + SECTION_GAP * 2;
      const readingBottom = bounds ? bounds.bottom : window.innerHeight;
      const focusLine = readingTop + (readingBottom - readingTop) / 2;
      let current = sections[0].id;

      for (const section of sections) {
        const element = document.getElementById(section.id);

        if (element && element.getBoundingClientRect().top <= focusLine) {
          current = section.id;
        }
      }

      setActiveId(current);
    }

    function releasePin() {
      pinnedRef.current = null;
    }

    resolveActive();
    source.addEventListener("scroll", resolveActive, { passive: true });
    window.addEventListener("resize", resolveActive);
    window.addEventListener("wheel", releasePin, { passive: true });
    window.addEventListener("touchmove", releasePin, { passive: true });
    window.addEventListener("keydown", releasePin);

    return () => {
      source.removeEventListener("scroll", resolveActive);
      window.removeEventListener("resize", resolveActive);
      window.removeEventListener("wheel", releasePin);
      window.removeEventListener("touchmove", releasePin);
      window.removeEventListener("keydown", releasePin);
    };
  }, [sections]);

  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section.id === activeId),
  );

  return (
    <nav
      aria-label="Seções desta página"
      className={`sticky z-20 border-y-2 border-[#1a1a1a] bg-[#1a1a1a] ${className}`}
      ref={navRef}
    >
      <div className="p-2">
        <ul
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
        >
          <li
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 bg-brand-yellow transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              transform: `translateX(${activeIndex * 100}%)`,
              width: `${100 / sections.length}%`,
            }}
          />
          {sections.map((section) => {
            const active = section.id === activeId;

            return (
              <li className="min-w-0" key={section.id}>
                <a
                  aria-current={active ? "true" : undefined}
                  className={`relative flex items-center justify-center gap-2 px-2 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-yellow sm:tracking-[0.2em] ${
                    active ? "text-[#1a1a1a]" : "text-[#f5f1e8]/70 hover:text-brand-yellow"
                  }`}
                  href={`#${section.id}`}
                  onClick={() => {
                    pinnedRef.current = section.id;
                    setActiveId(section.id);
                  }}
                >
                  <span
                    aria-hidden
                    className={`hidden h-2 w-2 rotate-45 sm:inline-block ${
                      active ? "bg-[#1a1a1a]" : "bg-brand-yellow/40"
                    }`}
                  />
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
