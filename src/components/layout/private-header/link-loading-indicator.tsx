"use client";

import { useLinkStatus } from "next/link";

type PrivateHeaderLinkLoadingIndicatorProps = {
  className?: string;
};

/**
 * Indicador visual de navegação pendente para links do header privado.
 * Usa `useLinkStatus` do Next para refletir o estado real de transição da rota.
 */
export function PrivateHeaderLinkLoadingIndicator({
  className = "",
}: PrivateHeaderLinkLoadingIndicatorProps) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={`inline-block h-1.5 w-1.5 rounded-full bg-current transition-opacity ${
        pending ? "animate-pulse opacity-70" : "opacity-0"
      } ${className}`}
    />
  );
}
