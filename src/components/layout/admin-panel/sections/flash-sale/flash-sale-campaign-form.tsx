import { SlidersHorizontal } from "lucide-react";

import { InfoTooltip } from "../products/components/form-fields";
import { clampDiscountInput, type FlashSaleDraft } from "./utils";

type FlashSaleCampaignFormProps = {
  disabled?: boolean;
  draft: FlashSaleDraft;
  onChange: (patch: Partial<FlashSaleDraft>) => void;
};

const FIELD_INPUT =
  "h-11 w-full border-2 border-[#1a1a1a] bg-white px-4 text-sm leading-5 text-[#1a1a1a] outline-none transition focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const FIELD_LABEL =
  "block text-[10px] font-black uppercase leading-4 tracking-[0.18em] text-[#1a1a1a]";

export function FlashSaleCampaignForm({ disabled, draft, onChange }: FlashSaleCampaignFormProps) {
  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div className="h-2 w-full bg-brand-yellow" />
      <div className="p-4">
        <header className="mb-4 flex items-center gap-2 border-b-2 border-[#1a1a1a] pb-3">
          <SlidersHorizontal className="h-5 w-5 text-[#1a1a1a]" strokeWidth={2} />
          <h2 className="text-[15px] font-black uppercase tracking-[0.05em] text-[#1a1a1a]">
            Configuração da Campanha
          </h2>
        </header>

        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <label className={FIELD_LABEL} htmlFor="flashSaleTitle">
                Nome da Campanha
              </label>
              <InfoTooltip text="Esse campo não é obrigatório para começar uma campanha. Você pode definir, trocar ou remover o nome no meio da campanha quando quiser." />
            </div>
            <input
              className={FIELD_INPUT}
              disabled={disabled}
              id="flashSaleTitle"
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder="Opcional. Ex: Queima de Estoque"
              type="text"
              value={draft.title}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`${FIELD_LABEL} mb-1.5`} htmlFor="flashSaleStartsAt">
                Início
              </label>
              <input
                className={FIELD_INPUT}
                disabled={disabled}
                id="flashSaleStartsAt"
                onChange={(event) => onChange({ startsAt: event.target.value })}
                type="datetime-local"
                value={draft.startsAt}
              />
            </div>
            <div>
              <label className={`${FIELD_LABEL} mb-1.5`} htmlFor="flashSaleEndsAt">
                Término
              </label>
              <input
                className={FIELD_INPUT}
                disabled={disabled}
                id="flashSaleEndsAt"
                onChange={(event) => onChange({ endsAt: event.target.value })}
                type="datetime-local"
                value={draft.endsAt}
              />
            </div>
          </div>

          <div>
            <label className={`${FIELD_LABEL} mb-1.5`} htmlFor="flashSaleDiscount">
              Desconto da Campanha (%)
            </label>
            <div className="relative">
              <input
                className={`${FIELD_INPUT} pr-10`}
                disabled={disabled}
                id="flashSaleDiscount"
                inputMode="numeric"
                max={99}
                min={0}
                onChange={(event) =>
                  onChange({ discountPercent: clampDiscountInput(event.target.value) })
                }
                placeholder="15"
                step={1}
                type="number"
                value={draft.discountPercent ? String(draft.discountPercent) : ""}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1a1a1a]">
                %
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-4.5 text-text-secondary">
              Preço fixo aplicado a todos os produtos da lista, calculado sobre o preço base de cada
              item.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
