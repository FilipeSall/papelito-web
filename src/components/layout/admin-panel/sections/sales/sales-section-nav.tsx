"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const COLLAPSE_STORAGE_KEY = "papelito.admin.sales.nav.collapsed";

// Trocar filtro remonta a página inteira: sem lembrar a escolha, o recolhido
// voltaria a abrir a cada clique de filtro. Fica num store externo porque é
// estado do navegador, não do componente — e assim o servidor renderiza aberto
// sem divergir da hidratação.
const collapseListeners = new Set<() => void>();

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeCollapsed(onChange: () => void) {
  collapseListeners.add(onChange);
  return () => collapseListeners.delete(onChange);
}

function writeCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Preferência é conveniência: sem storage, o padrão continua valendo.
  }

  collapseListeners.forEach((listener) => listener());
}

export type SalesSectionLink = {
  id: string;
  label: string;
};

/**
 * Navegação flutuante das seções da página de vendas.
 *
 * O conteúdo do admin rola dentro de um contêiner (`admin-shell`), não na janela:
 * a seção ativa é resolvida contra esse contêiner, como faz o `AnchoredSectionNav`
 * das telas de configuração. Medir contra o viewport, ou usar offset fixo, é o que
 * faz o item clicado não ficar ativo.
 */
export function SalesSectionNav({
  sections,
}: Readonly<{
  sections: readonly SalesSectionLink[];
}>) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const pinnedRef = useRef<string | null>(null);

  useEffect(() => {
    const first = document.getElementById(sections[0]?.id ?? "");

    if (!first) {
      return;
    }

    const scroller = first.closest<HTMLElement>(".overflow-y-auto");
    const source: HTMLElement | Window = scroller ?? window;

    function readingLine() {
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      const height = scroller ? scroller.clientHeight : window.innerHeight;
      return top + height * 0.25;
    }

    function reachedEnd() {
      if (!scroller) {
        return (
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
        );
      }

      return scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4;
    }

    function resolveActive() {
      const line = readingLine();
      let current = sections[0]?.id ?? "";

      for (const section of sections) {
        const element = document.getElementById(section.id);

        if (element && element.getBoundingClientRect().top <= line) {
          current = section.id;
        }
      }

      // A última seção pode ser curta demais para cruzar a linha de leitura: quando
      // o contêiner chega ao fim, ela é a seção em que o leitor está.
      if (reachedEnd()) {
        current = sections[sections.length - 1]?.id ?? current;
      }

      if (pinnedRef.current && pinnedRef.current !== current) {
        return;
      }

      pinnedRef.current = null;
      setActiveId(current);
    }

    function releasePin() {
      pinnedRef.current = null;
      resolveActive();
    }

    resolveActive();
    source.addEventListener("scroll", resolveActive, { passive: true });
    source.addEventListener("wheel", releasePin, { passive: true });
    source.addEventListener("touchmove", releasePin, { passive: true });
    window.addEventListener("resize", resolveActive);

    return () => {
      source.removeEventListener("scroll", resolveActive);
      source.removeEventListener("wheel", releasePin);
      source.removeEventListener("touchmove", releasePin);
      window.removeEventListener("resize", resolveActive);
    };
  }, [sections]);

  return (
    <nav
      aria-label="Seções desta página"
      className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
    >
      <div className="pointer-events-auto border-2 border-[#1a1a1a] bg-[#fbf7ef]/95 p-2 shadow-[4px_4px_0px_#1a1a1a] backdrop-blur-sm">
        <button
          aria-controls="sales-section-nav-list"
          aria-expanded={!collapsed}
          className="flex min-h-9 w-full items-center justify-between gap-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/60 transition-colors hover:bg-[#f7f2e7] hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1a1a1a]"
          onClick={() => writeCollapsed(!collapsed)}
          type="button"
        >
          <span>{collapsed ? "Seções" : "Recolher"}</span>
          <span
            aria-hidden
            className={[
              "border-[#1a1a1a] transition-transform",
              collapsed
                ? "h-0 w-0 border-y-4 border-l-[6px] border-y-transparent border-l-[#1a1a1a]"
                : "h-0 w-0 border-x-4 border-t-[6px] border-x-transparent border-t-[#1a1a1a]",
            ].join(" ")}
          />
        </button>

      <ul
        className="mt-1 flex flex-col gap-1 border-t-2 border-dashed border-[#1a1a1a]/28 pt-1"
        hidden={collapsed}
        id="sales-section-nav-list"
      >
        {sections.map((section) => {
          const active = section.id === activeId;

          return (
            <li key={section.id}>
              <a
                aria-current={active ? "true" : undefined}
                className={[
                  "flex min-h-9 items-center gap-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] transition-colors",
                  active
                    ? "bg-brand-yellow text-[#1a1a1a]"
                    : "text-[#1a1a1a]/60 hover:bg-[#f7f2e7] hover:text-[#1a1a1a]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1a1a1a]",
                ].join(" ")}
                href={`#${section.id}`}
                onClick={() => {
                  pinnedRef.current = section.id;
                  setActiveId(section.id);
                }}
              >
                <span
                  aria-hidden
                  className={[
                    "h-1.5 w-1.5 rotate-45",
                    active ? "bg-[#1a1a1a]" : "bg-[#1a1a1a]/30",
                  ].join(" ")}
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
