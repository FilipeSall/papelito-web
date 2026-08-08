import type { HomeFlashSaleCampaign } from "@/features/catalog/types/home-products";

import type { PaymentConfig } from "../services/get-payment-config";
import type { RichTextResolutionContext } from "./context";

/**
 * Monta o contexto de resolução a partir de dados que a página já carregou.
 *
 * A campanha relâmpago continua sendo a única autoridade de preço promocional: os tokens de
 * produto leem o payload de `/home/flash-sale`, sem recalcular desconto nem consultar o
 * catálogo por fora.
 */
export function buildRichTextContext(input: {
  freeShippingMinimumCents: number | null;
  flashSaleCampaign: HomeFlashSaleCampaign | null;
  paymentConfig: PaymentConfig | null;
}): RichTextResolutionContext {
  const campaign = input.flashSaleCampaign;

  return {
    freeShippingMinimumCents: input.freeShippingMinimumCents,
    installments: input.paymentConfig
      ? {
          max: input.paymentConfig.maxInstallments,
          minimumCents: input.paymentConfig.installmentMinimumCents,
        }
      : null,
    promotion: campaign
      ? {
          title: campaign.title,
          discountPercent: campaign.products.reduce(
            (highest, product) => Math.max(highest, product.discount),
            0,
          ),
          endsAt: campaign.endsAt,
        }
      : null,
    promotionProducts: (campaign?.products ?? []).flatMap((product) => {
      const productId = Number(product.id);
      return Number.isSafeInteger(productId) && productId > 0
        ? [
            {
              productId,
              name: product.name,
              price: product.price,
              originalPrice: product.originalPrice,
              discount: product.discount,
            },
          ]
        : [];
    }),
  };
}
