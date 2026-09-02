"use client";

import { usePathname } from "next/navigation";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const VIEWPORT_MARGIN_PX = 8;
const HIDDEN_STORAGE_KEY = "papelito.admin.sales.nav.hidden";

type NavPosition = {
  left: number;
  top: number;
};

type NavPlacement = {
  pathname: string | null;
  position: NavPosition | null;
};

const INITIAL_PLACEMENT: NavPlacement = {
  pathname: null,
  position: null,
};

// Ocultar vale até o próximo carregamento da página: fica na sessão para
// atravessar navegação e submit de filtro, e é apagado no boot deste módulo —
// que roda uma vez por carregamento — porque sessionStorage sobrevive ao F5 por
// conta própria e a navegação precisa voltar quando a página recarrega.
if (typeof window !== "undefined") {
  try {
    window.sessionStorage.removeItem(HIDDEN_STORAGE_KEY);
  } catch {
    // Sem storage, ocultar vale só enquanto o componente estiver montado.
  }
}

// A posição arrastada vale só para a visita atual da página: fica num store de
// módulo, carimbado com a rota, para sobreviver ao remonte que a troca de filtro
// provoca e ser descartada ao trocar de seção ou recarregar.
let placement = INITIAL_PLACEMENT;
const navListeners = new Set<() => void>();

function subscribeNav(onChange: () => void) {
  navListeners.add(onChange);
  return () => navListeners.delete(onChange);
}

function readHidden() {
  try {
    return window.sessionStorage.getItem(HIDDEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function hideNav() {
  try {
    window.sessionStorage.setItem(HIDDEN_STORAGE_KEY, "1");
  } catch {
    // Sem storage, ocultar vale só enquanto o componente estiver montado.
  }

  navListeners.forEach((listener) => listener());
}

function readPlacement() {
  return placement;
}

function placementFor(pathname: string | null, current: NavPlacement) {
  return current.pathname === pathname ? current : INITIAL_PLACEMENT;
}

function writePlacement(pathname: string | null, patch: Partial<NavPlacement>) {
  placement = { ...placementFor(pathname, placement), ...patch, pathname };
  navListeners.forEach((listener) => listener());
}

function clampToRange(value: number, min: number, max: number) {
  if (min > max) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function positionWithinViewport(
  left: number,
  top: number,
  width: number,
  height: number,
): NavPosition {
  return {
    left: clampToRange(left, VIEWPORT_MARGIN_PX, window.innerWidth - width - VIEWPORT_MARGIN_PX),
    top: clampToRange(top, VIEWPORT_MARGIN_PX, window.innerHeight - height - VIEWPORT_MARGIN_PX),
  };
}

const GRIP_DOTS = [0, 1, 2, 3, 4, 5] as const;

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
  const pinnedRef = useRef<string | null>(null);
  const pathname = usePathname();
  const hidden = useSyncExternalStore(subscribeNav, readHidden, () => false);
  const stored = useSyncExternalStore(subscribeNav, readPlacement, () => INITIAL_PLACEMENT);
  const { position } = placementFor(pathname, stored);
  const [dragging, setDragging] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const positionRef = useRef<NavPosition | null>(position);
  const endDragRef = useRef<(() => void) | null>(null);

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

  useEffect(() => () => endDragRef.current?.(), []);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const nav = navRef.current;

    // Recolher, reabrir ou redimensionar a janela muda a caixa do painel: sem
    // reancorar, a navegação arrastada para a borda ficaria fora da viewport.
    function keepInsideViewport() {
      const current = positionRef.current;

      if (!nav || !current) {
        return;
      }

      const rect = nav.getBoundingClientRect();
      const next = positionWithinViewport(
        current.left,
        current.top,
        rect.width,
        rect.height,
      );

      if (next.left !== current.left || next.top !== current.top) {
        writePlacement(pathname, { position: next });
      }
    }

    window.addEventListener("resize", keepInsideViewport);

    const observer =
      nav && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(keepInsideViewport)
        : null;

    observer?.observe(nav as HTMLElement);

    return () => {
      window.removeEventListener("resize", keepInsideViewport);
      observer?.disconnect();
    };
  }, [pathname]);

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    const nav = navRef.current;

    if (event.button !== 0 || !nav) {
      return;
    }

    const rect = nav.getBoundingClientRect();
    const grabX = event.clientX - rect.left;
    const grabY = event.clientY - rect.top;
    const pointerId = event.pointerId;

    event.preventDefault();
    endDragRef.current?.();
    setDragging(true);

    function handleMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) {
        return;
      }

      moveEvent.preventDefault();
      writePlacement(pathname, {
        position: positionWithinViewport(
          moveEvent.clientX - grabX,
          moveEvent.clientY - grabY,
          rect.width,
          rect.height,
        ),
      });
    }

    function handleEnd(endEvent: PointerEvent) {
      if (endEvent.pointerId !== pointerId) {
        return;
      }

      endDrag();
    }

    function endDrag() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
      endDragRef.current = null;
      setDragging(false);
    }

    endDragRef.current = endDrag;
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
  }

  if (hidden) {
    return null;
  }

  return (
    <nav
      aria-label="Seções desta página"
      className={[
        "pointer-events-none fixed z-30 hidden xl:block",
        position ? "" : "right-6 top-1/2 -translate-y-1/2",
      ].join(" ")}
      ref={navRef}
      style={position ? { left: position.left, top: position.top } : undefined}
    >
      <div className="pointer-events-auto border-2 border-[#1a1a1a] bg-[#fbf7ef]/95 p-2 shadow-[4px_4px_0px_#1a1a1a] backdrop-blur-sm">
        <span
          aria-hidden
          className={[
            "flex touch-none select-none items-center justify-center border-b-2 border-dashed border-[#1a1a1a]/28 pb-1.5 pt-0.5 transition-colors hover:bg-[#f7f2e7]",
            dragging ? "cursor-grabbing" : "cursor-grab",
          ].join(" ")}
          onPointerDown={startDrag}
          title="Arraste para mover"
        >
          <span className="grid grid-cols-3 gap-[3px]">
            {GRIP_DOTS.map((dot) => (
              <span className="h-[3px] w-[3px] bg-[#1a1a1a]/45" key={dot} />
            ))}
          </span>
        </span>

        <button
          className="mt-1 flex min-h-9 w-full cursor-pointer items-center justify-between gap-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/60 transition-colors hover:bg-[#f7f2e7] hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1a1a1a]"
          onClick={hideNav}
          title="Só volta ao recarregar a página"
          type="button"
        >
          <span>Ocultar</span>
          <span aria-hidden className="text-[13px] leading-none">
            ×
          </span>
        </button>

      <ul className="mt-1 flex flex-col gap-1 border-t-2 border-dashed border-[#1a1a1a]/28 pt-1">
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
