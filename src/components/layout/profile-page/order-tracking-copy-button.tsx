"use client";

import { useState } from "react";

type OrderTrackingCopyButtonProps = {
  value: string;
  label?: string;
};

/**
 * Botão que copia um identificador do pedido para a área de transferência.
 */
export function OrderTrackingCopyButton({
  value,
  label = "Copiar código de rastreamento",
}: OrderTrackingCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      aria-label={label}
      className="inline-flex size-6 items-center justify-center rounded text-gray-500 transition hover:bg-gray-200 hover:text-brand-dark"
      onClick={handleCopy}
      type="button"
    >
      {copied ? (
        <svg
          aria-hidden
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg
          aria-hidden
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <rect height="12" rx="2" width="12" x="9" y="9" />
          <rect height="12" rx="2" width="12" x="3" y="3" />
        </svg>
      )}
    </button>
  );
}
