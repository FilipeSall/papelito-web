export type CheckoutAddressForm = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type PaymentMethod = "credit_card" | "pix" | "boleto";

export type PaymentForm = {
  holderName: string;
  installments: string;
  cardTokenId: string;
  cardLast4: string;
};

export type PaymentBillingAddress = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type CepLookupResult = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type ShippingQuoteItem = {
  productId: number;
  qty: number;
};

/**
 * Transportadoras que o contrato normalizado de frete reconhece.
 * O campo pode faltar no estado persistido antes da migração; nesse caso, os
 * consumidores devem inferir Correios somente para manter a seleção legada.
 */
export type ShippingProvider = "correios" | "braspress";

export type ShippingQuoteOption = {
  provider?: ShippingProvider;
  optionKey?: string;
  serviceCode?: string;
  carrierCostCents?: number;
  fingerprint?: string;
  customerPriceCents?: number;
  quotedAt?: string | null;
  expiresAt?: string | null;
  externalQuoteId?: string | null;
  service: string;
  code: string;
  name: string;
  price: number;
  deliveryTime: number | null;
};

export type ShippingQuoteResult = {
  originCep: string;
  destinationCep: string;
  vendorId: number;
  options: ShippingQuoteOption[];
};

export type CheckoutShippingQuoteState = {
  quote: ShippingQuoteResult | null;
  selectedOption: ShippingQuoteOption | null;
};

export type PlaceOrderInput = {
  checkoutAttemptId: string;
	expectedCompanyId?: number;
  items: Array<{
    productId: number;
    qty: number;
    vendorId: number;
    vendorName: string;
    promotionContext?: string;
  }>;
  address: CheckoutAddressForm;
  shipping: {
    selectedOptionKey?: string;
    selectedCode?: string;
    expectedFingerprint?: string;
    expectedCustomerPriceCents?: number;
    expectedDeliveryTime?: number | null;
    expectedExpiresAt?: string | null;
    destinationCep: string;
  };
  payment: {
    method: PaymentMethod;
    installments?: number;
    cardTokenId?: string;
    holderName?: string;
    billingAddress?: PaymentBillingAddress;
  };
  couponCode?: string | null;
  analytics?: {
    clientId?: string;
    sessionId?: string;
  };
};

export type PlaceOrderPaymentResult = {
  method: PaymentMethod;
  state: string;
  pix?: {
    qr_code?: string;
    copy_paste?: string;
    expires_at?: string;
  };
  boleto?: {
    url?: string;
    line?: string;
    expires_at?: string;
  };
};

export type PlaceOrderResult = {
  orderId: number;
  orderNumber: string;
  status: string;
  payment: PlaceOrderPaymentResult;
  totals: {
    subtotalCents: number;
    discountCents: number;
    itemsCents: number;
    shippingCents: number;
    shippingDiscountCents: number;
    totalCents: number;
  };
};

export type PlaceOrderError = {
  code: string;
  message: string;
  status?: number;
};

export type PlaceOrderResponse =
  | { ok: true; result: PlaceOrderResult }
  | { ok: false; error: PlaceOrderError };
