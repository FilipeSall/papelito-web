"use client";

import {
  ProductBenefitsBar,
  resolveProductBenefits,
} from "@/components/layout/product-benefits-bar";
import type { RichTextResolutionContext } from "@/features/rich-text";
import type { AdminBenefitItem } from "@/types/product-benefits";

import { DIAMOND_CLASS, MUTED_TEXT_CLASS, SUBPANEL_CLASS } from "../field-classes";

/**
 * Prévia da faixa da página de produto.
 *
 * Deliberadamente NÃO imita o layout com uma marcação própria: renderiza o
 * mesmo `ProductBenefitsBar` que a PDP usa. A prévia dos benefícios da Home
 * desenha a faixa horizontal abaixo do header à mão e por isso não serve aqui —
 * a faixa do produto é um bloco centralizado, com o ícone acima do título. Ao
 * reusar o componente real, ícone, título, texto e a quantidade de colunas não
 * têm como divergir do que o cliente vê.
 */
export function ProductBenefitsPreview({
  items,
  richTextContext,
}: Readonly<{
  items: Array<AdminBenefitItem & { key?: string }>;
  richTextContext: RichTextResolutionContext;
}>) {
  const resolved = resolveProductBenefits(
    items
      .filter((item) => item.isActive && item.title.trim() !== "")
      .map((item) => ({
        id: item.id,
        renderKey: item.key ?? item.id,
        iconType: item.iconType,
        iconEmoji: item.iconEmoji,
        iconUrl: item.iconUrl,
        title: item.title,
        description: item.description,
        descriptionContent: item.descriptionContent,
      })),
    richTextContext,
  );

  return (
    <div className={SUBPANEL_CLASS}>
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/[.56]">
        <span aria-hidden className={DIAMOND_CLASS} />
        <span>Prévia na página de produto</span>
      </p>

      {resolved.length === 0 ? (
        <p className={`mt-3 ${MUTED_TEXT_CLASS}`}>
          Nenhum benefício ativo: a faixa não aparece na página de produto.
        </p>
      ) : (
        <div className="max-w-lg">
          <ProductBenefitsBar items={resolved} />
        </div>
      )}
    </div>
  );
}
