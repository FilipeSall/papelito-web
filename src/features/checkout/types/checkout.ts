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
  /** Omitido quando o gateway é o Mercado Pago: o método é escolhido dentro do Checkout Pro. */
  payment?: PlaceOrderPaymentInput | null;
  couponCode?: string | null;
  analytics?: {
    clientId?: string;
    sessionId?: string;
  };
};

/** Gateway que emitiu o pagamento da tentativa. */
export type CheckoutPaymentProvider = "mercadopago" | "pagarme";

/**
 * Modo do pagamento devolvido pelo place-order: cobrança direta Pagar.me, redirect ao
 * Checkout Pro ou coleta Pagar.me pendente na mesma tentativa.
 */
export type CheckoutPaymentFlow = "direct" | "redirect" | "requires_payment_input";

/** Dados de pagamento Pagar.me já tokenizados; o número do cartão nunca entra aqui. */
export type PlaceOrderPaymentInput = {
  method: PaymentMethod;
  installments?: number;
  cardTokenId?: string;
  holderName?: string;
  billingAddress?: PaymentBillingAddress;
};

/**
 * Pagamento devolvido pelo backend. Resposta legada traz só `method`/`state`; a nova traz
 * gateway, fluxo e tentativa, e `method` pode faltar antes de pagar no Checkout Pro.
 */
export type PlaceOrderPaymentResult = {
  method?: PaymentMethod | "";
  state: string;
  provider?: CheckoutPaymentProvider;
  flow?: CheckoutPaymentFlow;
  paymentAttemptId?: number;
  configurationVersion?: string;
  fallbackReason?: string;
  /** Só em `redirect` pendente, e sempre HTTPS de domínio do Mercado Pago. */
  redirectUrl?: string;
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
  /** Pedido já criado cujo pagamento está em reconciliação; o comprador acompanha por ele. */
  orderId?: number;
  /** Versão nova que a tentativa passou a esperar (configuração obsoleta), sem cobrança feita. */
  configurationVersion?: string;
};

export type PlaceOrderResponse =
  | { ok: true; result: PlaceOrderResult }
  | { ok: false; error: PlaceOrderError };

/**
 * Tentativa de pagamento que aguarda a coleta Pagar.me depois que o Mercado Pago falhou antes
 * de criar a cobrança. Fica no store persistido para sobreviver ao recarregamento; nunca guarda
 * token de cartão.
 */
export type PendingPaymentAttempt = {
  orderId: number;
  paymentAttemptId: number;
  configurationVersion: string;
};

/** Resultado da continuação de uma tentativa: o mesmo pedido, sem totais garantidos. */
export type ContinuePaymentResult = {
  orderId: number;
  orderNumber: string;
  status: string;
  payment: PlaceOrderPaymentResult;
};

export type ContinuePaymentResponse =
  | { ok: true; result: ContinuePaymentResult }
  | { ok: false; error: PlaceOrderError };
