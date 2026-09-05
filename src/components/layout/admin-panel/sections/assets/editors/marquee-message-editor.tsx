"use client";

import {
  documentToPlainText,
  resolveRichTextSource,
  type RichTextResolutionContext,
} from "@/features/rich-text";
import type { PromoMarqueeItem } from "@/types/home-assets";

import { LABEL_CLASS } from "../field-classes";
import { RichTextEditor } from "../rich-text/rich-text-editor";

export function MarqueeMessageEditor({
  index,
  isSaving,
  message,
  onChange,
  richTextContext,
}: {
  index: number;
  isSaving: boolean;
  message: PromoMarqueeItem;
  onChange: (patch: Partial<PromoMarqueeItem>) => void;
  richTextContext: RichTextResolutionContext;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className={LABEL_CLASS}>Mensagem *</p>
        <RichTextEditor
          ariaLabel={`Mensagem ${index + 1}`}
          context={richTextContext}
          disabled={isSaving}
          id={`promo-marquee-${message.id}`}
          maxLength={120}
          onChange={(content) => onChange({ content, text: documentToPlainText(content) })}
          promotionProducts={richTextContext.promotionProducts}
          value={resolveRichTextSource(message.content, message.text)}
        />
      </div>

      <label
        className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-none border-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
          message.isActive
            ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]"
            : "border-[#1a1a1a] bg-white text-[#231f20]/60"
        }`}
      >
        <input
          checked={message.isActive}
          className="h-4 w-4 accent-[#1a1a1a]"
          disabled={isSaving}
          onChange={(event) => onChange({ isActive: event.target.checked })}
          type="checkbox"
        />
        {message.isActive ? "Ativa na faixa" : "Inativa, não aparece no site"}
      </label>
    </div>
  );
}
