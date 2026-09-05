"use client";

import { TriangleAlert } from "lucide-react";
import { useRef } from "react";

import { FOCUS_RING } from "@/components/layout/admin-panel/primitives";

import { ASSETS_PAGES, type AssetsPageKey } from "./assets-config";

export type AssetsPageSummary = {
  attention: number;
  total: number;
};

export function assetsTabId(page: AssetsPageKey) {
  return `assets-tab-${page}`;
}

export function assetsPanelId(page: AssetsPageKey) {
  return `assets-panel-${page}`;
}

/**
 * Segmentos na mesma gramática de Contas e Produtos, mas como `tablist`: a troca é de cliente,
 * então o controle é um botão e não um link, e a navegação por seta precisa ser explícita.
 */
export function AssetsPageTabs({
  activePage,
  onSelect,
  summaries,
}: {
  activePage: AssetsPageKey;
  onSelect: (page: AssetsPageKey) => void;
  summaries: Record<AssetsPageKey, AssetsPageSummary>;
}) {
  const tabRefs = useRef(new Map<AssetsPageKey, HTMLButtonElement>());

  function focusPage(page: AssetsPageKey) {
    onSelect(page);
    tabRefs.current.get(page)?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = ASSETS_PAGES.length - 1;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusPage(ASSETS_PAGES[index === lastIndex ? 0 : index + 1].key);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusPage(ASSETS_PAGES[index === 0 ? lastIndex : index - 1].key);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusPage(ASSETS_PAGES[0].key);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusPage(ASSETS_PAGES[lastIndex].key);
    }
  }

  return (
    <div
      aria-label="Páginas do site"
      className="flex flex-wrap items-center gap-2"
      role="tablist"
    >
      {ASSETS_PAGES.map((page, index) => {
        const isActive = page.key === activePage;
        const summary = summaries[page.key];
        const Icon = page.icon;

        return (
          <button
            aria-controls={assetsPanelId(page.key)}
            aria-selected={isActive}
            className={[
              "inline-flex items-center gap-2 border-2 border-[#1a1a1a] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition",
              FOCUS_RING,
              isActive
                ? "bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]"
                : "bg-white text-[#1a1a1a] hover:bg-brand-yellow",
            ].join(" ")}
            id={assetsTabId(page.key)}
            key={page.key}
            onClick={() => onSelect(page.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            ref={(node) => {
              if (node) {
                tabRefs.current.set(page.key, node);
              } else {
                tabRefs.current.delete(page.key);
              }
            }}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            <Icon aria-hidden className="h-4 w-4" strokeWidth={2.2} />
            <span>{page.label}</span>
            <span
              className={[
                "inline-flex min-w-6 items-center justify-center border px-1.5 py-0.5 text-[10px] tabular-nums",
                isActive ? "border-brand-yellow" : "border-[#1a1a1a]/30",
              ].join(" ")}
            >
              {String(summary.total).padStart(2, "0")}
            </span>
            {summary.attention > 0 ? (
              <span className="inline-flex items-center gap-1">
                <TriangleAlert aria-hidden className="h-3.5 w-3.5" strokeWidth={2.6} />
                <span aria-hidden className="text-[10px] tabular-nums">
                  {summary.attention}
                </span>
                <span className="sr-only">
                  {summary.attention} asset{summary.attention === 1 ? "" : "s"} precisa
                  {summary.attention === 1 ? "" : "m"} de atenção
                </span>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
