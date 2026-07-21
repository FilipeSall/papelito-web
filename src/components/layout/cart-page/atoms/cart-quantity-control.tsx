import { useId } from "react";

import { Loader2 } from "lucide-react";

interface CartQuantityControlProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  increaseDisabled?: boolean;
  loading?: boolean;
  increaseDisabledReason?: string;
}

export function CartQuantityControl({
  quantity,
  onDecrease,
  onIncrease,
  increaseDisabled = false,
  loading = false,
  increaseDisabledReason,
}: CartQuantityControlProps) {
  const tooltipId = useId();
  const increaseBlocked = increaseDisabled || loading;
  const showTooltip = Boolean(increaseDisabledReason) && !loading;

  return (
    <div
      className="flex h-8.5 w-24.5 items-center rounded-full border border-[#E5E7EB] bg-white px-1"
      aria-busy={loading}
    >
      <button
        type="button"
        aria-label="Diminuir quantidade"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#99A1AF] transition enabled:hover:bg-[#F9FAFB] enabled:hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        disabled={loading}
        onClick={onDecrease}
      >
        -
      </button>
      <span className="w-6 text-center text-sm font-black text-brand-dark">
        {loading ? (
          <>
            <Loader2
              className="mx-auto h-3.5 w-3.5 animate-spin text-brand-dark"
              strokeWidth={2}
              aria-hidden
            />
            <span className="sr-only">Verificando estoque</span>
          </>
        ) : (
          quantity
        )}
      </span>
      <span className="group/qty-tooltip relative inline-flex">
        <button
          type="button"
          aria-label="Aumentar quantidade"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#99A1AF] transition enabled:hover:bg-[#F9FAFB] enabled:hover:text-brand-dark aria-disabled:cursor-not-allowed aria-disabled:opacity-40 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={increaseBlocked && !showTooltip}
          aria-disabled={increaseBlocked}
          aria-describedby={showTooltip ? tooltipId : undefined}
          onClick={() => {
            if (increaseBlocked) return;
            onIncrease();
          }}
        >
          +
        </button>
        {showTooltip ? (
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 w-max max-w-40 -translate-x-1/2 rounded-lg bg-brand-dark px-3 py-2 text-center text-[11px] font-black leading-4 text-white opacity-0 shadow-[0_12px_24px_rgba(35,31,32,0.25)] transition-opacity group-hover/qty-tooltip:opacity-100 group-focus-within/qty-tooltip:opacity-100"
          >
            {increaseDisabledReason}
          </span>
        ) : null}
      </span>
    </div>
  );
}
