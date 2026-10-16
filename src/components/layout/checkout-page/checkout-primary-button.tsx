import type { ReactNode } from "react";

import { ArrowRightIcon } from "@/components/ui/icons";

type CheckoutPrimaryButtonProps = {
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

/** Botão principal amarelo das etapas do checkout, com a seta de avanço. */
export function CheckoutPrimaryButton({ disabled = false, onClick, children }: Readonly<CheckoutPrimaryButtonProps>) {
  return (
    <button
      type="button"
      className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
      <ArrowRightIcon className="h-4.5 w-4.5" size={18} strokeWidth={1.8} />
    </button>
  );
}
