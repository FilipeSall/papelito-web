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
