import type { ReactNode } from "react";

type RadioCardProps = {
  title: string;
  sub?: ReactNode;
  checked: boolean;
  onSelect: () => void;
};

/** Opção em card inteiro clicável, com quadrado de check (nunca círculo). */
export function RadioCard({ title, sub, checked, onSelect }: Readonly<RadioCardProps>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left ${checked ? "border-[#231F20] bg-[#FFFBD6]" : "border-[#E4E4E7] bg-white"}`}
    >
      <span aria-hidden className={`mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-sm border-2 border-[#231F20] ${checked ? "bg-[#231F20]" : "bg-white"}`}>
        {checked ? <span className="expo-pop h-2.5 w-2.5 bg-brand-yellow" /> : null}
      </span>
      <span>
        <span className="block text-base font-extrabold">{title}</span>
        {sub ? <span className="block text-sm text-[#52525B]">{sub}</span> : null}
      </span>
    </button>
  );
}
