export type RichTextProductFact = {
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
};

export type RichTextPromotionFact = {
  title: string;
  discountPercent: number;
  endsAt: string;
};

export type RichTextResolutionContext = {
  freeShippingMinimumCents: number | null;
  installments: { max: number; minimumCents: number } | null;
  promotion: RichTextPromotionFact | null;
  promotionProducts: RichTextProductFact[];
};

export const EMPTY_RICH_TEXT_CONTEXT: RichTextResolutionContext = {
  freeShippingMinimumCents: null,
  installments: null,
  promotion: null,
  promotionProducts: [],
};
