import type { ReactNode } from "react";

const TONES = {
  error: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B42318]",
  warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
  info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
} as const;

type CheckoutNoticeProps = {
  /** Esconde o aviso sem condicional no JSX de quem chama. */
  show?: boolean;
  tone: keyof typeof TONES;
  children: ReactNode;
};

/** Aviso curto das etapas do checkout, no mesmo formato dos alertas já existentes. */
export function CheckoutNotice({ show = true, tone, children }: Readonly<CheckoutNoticeProps>) {
  if (!show) return null;

  return (
    <p className={`mt-4 rounded-[12px] border px-3 py-2 text-xs ${TONES[tone]}`} role={tone === "error" ? "alert" : undefined}>
      {children}
    </p>
  );
}
