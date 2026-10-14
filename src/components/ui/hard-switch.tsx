"use client";

/** Paleta do interruptor ligado: `brand` em amarelo, `positive` em verde de sucesso. */
export type HardSwitchTone = "brand" | "positive";

const HARD_SWITCH_PALETTE: Record<HardSwitchTone, { focus: string; knobOff: string; knobOn: string; trackOn: string }> = {
  brand: {
    focus: "focus-visible:outline-brand-yellow",
    knobOff: "bg-[#1a1a1a] text-brand-yellow",
    knobOn: "bg-brand-yellow text-[#1a1a1a]",
    trackOn: "bg-[#1a1a1a]",
  },
  positive: {
    focus: "focus-visible:outline-[#1a1a1a]",
    knobOff: "bg-[#1a1a1a] text-white",
    knobOn: "bg-white text-[#14532d]",
    trackOn: "bg-[#15803d]",
  },
};

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
  tone = "brand",
}: Readonly<{
  ariaLabel: string;
  checked: boolean;
  disabled?: boolean;
  id?: string;
  onChange: (next: boolean) => void;
  /** `positive` pinta o ligado de verde; use só quando o recurso ligado está de fato funcionando. */
  tone?: HardSwitchTone;
}>) {
  const palette = HARD_SWITCH_PALETTE[tone];

  return (
    <button
      aria-checked={checked}
      aria-label={ariaLabel}
      className={[
        "relative inline-flex h-9 w-18 shrink-0 cursor-pointer items-center border-2 border-[#1a1a1a] transition",
        `focus-visible:outline-2 focus-visible:outline-offset-2 ${palette.focus}`,
        "disabled:cursor-not-allowed disabled:opacity-45",
        checked ? palette.trackOn : "bg-white",
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
          checked ? `translate-x-8 ${palette.knobOn}` : `translate-x-0 ${palette.knobOff}`,
        ].join(" ")}
      >
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}
