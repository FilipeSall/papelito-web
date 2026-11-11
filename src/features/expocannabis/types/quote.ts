import type { EventLevel } from "./context";

/** Linha avulsa da cotação com o desconto do nível. */
export type QuoteLine = {
  productId: number;
  qty: number;
  unitCents: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
};

/** Cotação autoritativa do servidor; o total cobrado é sempre este. */
export type EventQuote = {
  units: number;
  level: EventLevel;
  lines: QuoteLine[];
  kit: { qty: number; unitCents: number; fullUnitCents: number; totalCents: number };
  itemsCents: number;
  discountCents: number;
  kitSavingsCents: number;
  shipping: { optionKey: string; name: string; priceCents: number; deliveryTime: number | null };
  totalCents: number;
  quoteFingerprint: string;
};

/** Item do pedido enviado ao servidor. */
export type QuoteItemInput = { productId: number; qty: number };

/** Entrada da cotação. */
export type QuoteInput = {
  items: QuoteItemInput[];
  kits: number;
  cep: string;
  recipientCnpj: string;
};
