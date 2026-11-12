import type { ReactNode } from "react";

type RadioCardProps = {
  title: string;
  sub?: ReactNode;
  /** Rótulo curto à direita, como "Mais rápido". */
  tag?: string;
  checked: boolean;
  /** `compact` é o card dos formulários; `large` é o das formas de pagamento. */
  variant?: "compact" | "large";
  onSelect: () => void;
};

const VARIANT_CLASS = {
  compact: { box: "items-start gap-3.5 px-4.5 py-4", title: "text-[17px]" },
  large: { box: "min-h-21 items-center gap-4 px-5 py-4.5", title: "text-[19px]" },
};

function CheckBox({ checked }: Readonly<{ checked: boolean }>) {
  const state = checked ? "border-[#231F20] bg-[#231F20]" : "border-[#A1A1AA] bg-white";
  const mark = checked ? "scale-100 opacity-100" : "scale-60 opacity-0";
  return (
    <span aria-hidden className={`mt-px grid size-6 flex-none place-items-center rounded-md border-2 transition-colors duration-150 motion-reduce:transition-none ${state}`}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`text-brand-yellow transition-[opacity,transform] duration-180 ease-[cubic-bezier(.2,.9,.3,1.4)] motion-reduce:transition-none ${mark}`}
      >
        <path d="m5 12 5 5 9-10" />
      </svg>
    </span>
  );
}

/** Opção em card inteiro clicável, com quadrado de check (nunca círculo). */
export function RadioCard({ title, sub, tag, checked, variant = "compact", onSelect }: Readonly<RadioCardProps>) {
  const look = VARIANT_CLASS[variant];
  const surface = checked ? "border-[#231F20] bg-[#FFFBD6]" : "border-[#E4E4E7] bg-white";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex w-full rounded-[10px] border-2 text-left transition-[border-color,background-color,transform] duration-150 active:scale-99 motion-reduce:transition-none ${look.box} ${surface}`}
    >
      <CheckBox checked={checked} />
      <span className="min-w-0 flex-1">
        <span className={`block font-extrabold ${look.title}`}>{title}</span>
        {sub ? <span className="mt-0.75 block text-[15px] leading-[1.4] font-medium text-[#52525B]">{sub}</span> : null}
      </span>
      {tag ? <span className="flex-none rounded-sm bg-[#F4F4F5] px-2.25 py-1.25 text-[13px] font-extrabold">{tag}</span> : null}
    </button>
  );
}
