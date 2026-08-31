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

      const atBottom = scroller
        ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4
        : window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;

      if (atBottom) {
        setActiveId(sections[sections.length - 1].id);
        return;
      }

      const scrollerTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const line = scrollerTop + offset + SECTION_GAP * 2;
      let current = sections[0].id;

      for (const section of sections) {
        const element = document.getElementById(section.id);

        if (element && element.getBoundingClientRect().top <= line) {
          current = section.id;
        }
      }

      setActiveId(current);
    }

    resolveActive();
    source.addEventListener("scroll", resolveActive, { passive: true });
    window.addEventListener("resize", resolveActive);

    return () => {
      source.removeEventListener("scroll", resolveActive);
      window.removeEventListener("resize", resolveActive);
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
      <ul
        className="relative grid py-2"
        style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
      >
        <li
          aria-hidden
          className="pointer-events-none absolute top-2 bottom-2 left-0 bg-brand-yellow transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
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
                className={`relative flex items-center justify-center gap-2 px-2 py-2 text-center text-[11px] font-black uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-yellow sm:tracking-[0.2em] ${
                  active ? "text-[#1a1a1a]" : "text-[#f5f1e8]/70 hover:text-brand-yellow"
                }`}
                href={`#${section.id}`}
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
    </nav>
  );
}
