import { formatCents } from "@/features/expocannabis/utils/cart";

import { FIELD_FOCUS_WITHIN } from "./expoday-field";

type ExpodayKitPanelProps = {
  /** Desconto do kit como o admin digitou. */
  pctOff: string;
  /** O texto do desconto não é um inteiro de 0 a 50. */
  invalid: boolean;
  /** Preço do kit com o rascunho, ou `null` quando não dá para calcular. */
  unitCents: number | null;
  /** Os 4 produtos do kit estão no catálogo do estande. */
  available: boolean;
  /** Publicação em andamento: o campo fica travado até a resposta. */
  disabled: boolean;
  onChange: (raw: string) => void;
};

function KitPrice({ available, unitCents }: Readonly<Pick<ExpodayKitPanelProps, "available" | "unitCents">>) {
  if (!available) {
    return <p className="text-sm font-semibold text-[#c0392b]">Indisponível: falta um dos 4 produtos no catálogo do estande.</p>;
  }

  return (
    <p className="text-[26px] font-extrabold tabular-nums" data-testid="expoday-kit-price">
      {unitCents === null ? "—" : formatCents(unitCents)}
    </p>
  );
}

/**
 * Desconto do Kit Premium no estande e o preço que ele resulta com os preços do rascunho. O kit
 * soma Insane, Pink, Insane Brown e Alfafa no preço do estande, com o desconto em cada um.
 */
export function ExpodayKitPanel({ available, disabled, invalid, onChange, pctOff, unitCents }: Readonly<ExpodayKitPanelProps>) {
  return (
    <section aria-labelledby="expoday-kit-title" className="grid min-w-0 content-start gap-3">
      <h3 className="text-[11px] font-black uppercase tracking-[0.22em]" id="expoday-kit-title">
        Kit de Sedas Premium
      </h3>
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-1">
          <label className="text-xs font-bold" htmlFor="expoday-kit-pct">
            Desconto do kit
          </label>
          <span
            className={[
              "flex h-11 w-28 items-center border-2",
              invalid ? "border-[#c0392b] bg-[#fff1f0]" : "border-[#1a1a1a] bg-white",
              FIELD_FOCUS_WITHIN,
            ].join(" ")}
          >
            <span aria-hidden className="pl-3 text-sm text-[#231f20]/60">−</span>
            <input
              aria-describedby="expoday-kit-help"
              aria-invalid={invalid || undefined}
              className="min-w-0 flex-1 bg-transparent px-2 text-base font-semibold tabular-nums outline-none disabled:cursor-not-allowed disabled:text-[#52525b]"
              disabled={disabled}
              id="expoday-kit-pct"
              inputMode="numeric"
              onChange={(event) => onChange(event.target.value)}
              value={pctOff}
            />
            <span aria-hidden className="pr-3 text-sm text-[#231f20]/60">%</span>
          </span>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#231f20]/64">Preço do kit</p>
          <KitPrice available={available} unitCents={unitCents} />
        </div>
      </div>
      <p className={`text-xs leading-5 ${invalid ? "font-bold text-[#c0392b]" : "text-[#231f20]/72"}`} id="expoday-kit-help">
        {invalid ? "Use um número inteiro de 0 a 50." : "Conta 4 unidades · libera com 10+ un. · até 3 por pedido."}
      </p>
    </section>
  );
}
