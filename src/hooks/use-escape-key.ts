"use client";

import { useEffect } from "react";

type UseEscapeKeyOptions = {
  enabled?: boolean;
};

export function useEscapeKey(onEscape: () => void, { enabled = true }: UseEscapeKeyOptions = {}) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onEscape();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [enabled, onEscape]);
}
