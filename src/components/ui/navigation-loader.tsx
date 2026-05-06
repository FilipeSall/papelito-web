"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function NavigationLoaderInner() {
  const [startUrl, setStartUrl] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentUrl = search ? `${pathname}?${search}` : pathname;
  const loading = startUrl !== null && startUrl === currentUrl;

  if (startUrl !== null && startUrl !== currentUrl) {
    setStartUrl(null);
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
        setStartUrl(`${window.location.pathname}${window.location.search}`);
      } catch {
        // href inválido — ignorar
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div
      aria-hidden={!loading}
      role="status"
      className={`fixed inset-0 z-1600 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm transition-opacity duration-300 ${
        loading ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="relative size-28">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-brand-yellow/25 border-t-brand-yellow" />
        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-brand-yellow shadow-2xl">
          <Image
            alt="Papelito"
            height={42}
            priority
            src="/images/logo.svg"
            width={70}
          />
        </div>
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}
