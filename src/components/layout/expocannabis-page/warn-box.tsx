import type { ReactNode } from "react";

type WarnBoxProps = {
  children: ReactNode;
  /** Ação ao lado do texto, como "Tentar de novo". */
  action?: ReactNode;
};

/** Caixa de aviso vermelha (role alert) acima do CTA: erro de validação, falha e notice do checkout. */
export function WarnBox({ children, action }: Readonly<WarnBoxProps>) {
  return (
    <div role="alert" className="expo-warn-in mb-2.5 flex items-center justify-between gap-3 rounded-lg border-[1.5px] border-[#B42318] bg-[#FFF1F0] px-3.5 py-2.5 text-[15px] font-bold text-[#7A1A12]">
      <p>{children}</p>
      {action}
    </div>
  );
}
