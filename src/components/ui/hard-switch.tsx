"use client";

/**
 * Interruptor da camada dura, com o estado dito em texto e não só em cor.
 *
 * Vive em `ui/` porque o painel do vendor e o administrativo ligam o mesmo
 * recurso e precisam parecer o mesmo controle. O rótulo visível fica fora do
 * componente: quem usa decide se ele é um `<label>`, um título de seção ou uma
 * linha de tabela, e passa a descrição por `aria-label`.
 */
export function HardSwitch({
  ariaLabel,
  checked,
  disabled = false,
  id,
  onChange,
}: Readonly<{
  ariaLabel: string;
  checked: boolean;
  disabled?: boolean;
  id?: string;
  onChange: (next: boolean) => void;
}>) {
  return (
    <button
      aria-checked={checked}
      aria-label={ariaLabel}
      className={[
        "relative inline-flex h-9 w-18 shrink-0 cursor-pointer items-center border-2 border-[#1a1a1a] transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow",
        "disabled:cursor-not-allowed disabled:opacity-45",
        checked ? "bg-[#1a1a1a]" : "bg-white",
      ].join(" ")}
      disabled={disabled}
      id={id}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 inline-flex h-7 w-8 items-center justify-center text-[10px] font-black tracking-[0.12em] uppercase transition",
          checked
            ? "translate-x-8 bg-brand-yellow text-[#1a1a1a]"
            : "translate-x-0 bg-[#1a1a1a] text-brand-yellow",
        ].join(" ")}
      >
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}
