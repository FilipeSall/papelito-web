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
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  installments: string;
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

export type ShippingQuoteOption = {
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
  items: Array<{
    productId: number;
    qty: number;
    vendorId: number;
    vendorName: string;
  }>;
  address: CheckoutAddressForm;
  shipping: {
    selectedCode: string;
    destinationCep: string;
  };
  payment: {
    method: PaymentMethod;
  };
  couponCode?: string | null;
};

export type PlaceOrderResult = {
  orderId: number;
  orderNumber: string;
  status: string;
  paymentMocked: boolean;
};

export type PlaceOrderError = {
  code: string;
  message: string;
  status?: number;
};

export type PlaceOrderResponse =
  | { ok: true; result: PlaceOrderResult }
  | { ok: false; error: PlaceOrderError };
