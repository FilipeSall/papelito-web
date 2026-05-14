import { SlidersHorizontal } from "lucide-react";

import { InfoTooltip } from "../products/components/form-fields";
import { clampDiscountInput, type FlashSaleDraft } from "./utils";

type FlashSaleCampaignFormProps = {
  disabled?: boolean;
  draft: FlashSaleDraft;
  onChange: (patch: Partial<FlashSaleDraft>) => void;
};

const FIELD_INPUT =
  "h-11 w-full rounded-xl border border-[#cec7aa] bg-[#fff9ea] px-4 text-sm leading-5 text-[#1e1c10] outline-none transition focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00] disabled:cursor-not-allowed disabled:opacity-60";

const FIELD_LABEL =
  "block text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#1e1c10]";

export function FlashSaleCampaignForm({ disabled, draft, onChange }: FlashSaleCampaignFormProps) {
  return (
    <section className="rounded-2xl border border-[#cec7aa] bg-white p-4">
      <header className="mb-4 flex items-center gap-2 border-b border-[#cec7aa] pb-2">
        <SlidersHorizontal className="h-5 w-5 text-[#6a5f00]" strokeWidth={2} />
        <h2 className="text-[18px] font-semibold leading-6 text-[#1e1c10]">
          Configuração da Campanha
        </h2>
      </header>

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
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
            <label className={`${FIELD_LABEL} mb-1`} htmlFor="flashSaleStartsAt">
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
            <label className={`${FIELD_LABEL} mb-1`} htmlFor="flashSaleEndsAt">
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
          <label className={`${FIELD_LABEL} mb-1`} htmlFor="flashSaleDiscount">
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
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#4b4731]">
              %
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-[18px] text-[#4b4731]">
            Preço fixo aplicado a todos os produtos da lista, calculado sobre o preço base de cada
            item.
          </p>
        </div>
      </div>
    </section>
  );
}
