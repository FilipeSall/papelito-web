import {
  normalizeRichTextDocument,
  resolveRichTextDocument,
  type ResolvedRichTextNode,
  type RichTextResolutionContext,
} from "@/features/rich-text";
import type { ProductBenefitItem } from "@/types/product-benefits";

export type ResolvedProductBenefit = Omit<ProductBenefitItem, "descriptionContent"> & {
  descriptionNodes: ResolvedRichTextNode[] | null;
  renderKey?: string | number;
};

/**
 * Resolve os tokens da descrição contra o estado atual do marketplace.
 *
 * A degradação é em dois degraus, e é ela que preserva o comportamento que a PDP
 * já tinha: o conteúdo rico é a primeira escolha; quando algum token não resolve
 * — mínimo de frete grátis não configurado, campanha expirada — a frase cai para
 * o texto plano que o administrador escreveu ("Com cupom"), que é exatamente o
 * que `formatFreeShippingCouponCopy` devolvia nesse caso.
 *
 * O item só é descartado se ficar sem descrição alguma E sem título, o que o
 * backend já impede — aqui o item sem descrição renderiza só ícone e título.
 */
export function resolveProductBenefits(
  items: ProductBenefitItem[],
  context: RichTextResolutionContext,
): ResolvedProductBenefit[] {
  return items.map((item) => {
    const document = normalizeRichTextDocument(item.descriptionContent);
    const nodes = document === null ? null : resolveRichTextDocument(document, context);

    if (nodes !== null) {
      return { ...item, descriptionNodes: nodes };
    }

    return {
      ...item,
      descriptionNodes:
        item.description === ""
          ? null
          : [{ text: item.description, bold: false, italic: false }],
    };
  });
}
