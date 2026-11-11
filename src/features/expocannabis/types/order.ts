import type { QuoteItemInput } from "./quote";

/** Estado da cobrança que o tablet mostra. */
export type EventOrderState =
  | "sending"
  | "at_terminal"
  | "paid"
  | "failed"
  | "expired"
  | "canceled"
  | "check_terminal";

/** Forma de pagamento na maquininha. */
export type EventPaymentMethod = "card" | "pix";

/** Estado do pedido e da cobrança, devolvido ao criar, consultar e agir sobre o pedido. */
export type EventOrderStatus = {
  orderId: number;
  orderNumber: string;
  state: EventOrderState;
  detail: string;
  totalCents: number;
  method: EventPaymentMethod | "";
};

/** Loja encontrada na Receita pelo CNPJ. Número e bairro vêm vazios. */
export type BuyerLookup = {
  cnpj: string;
  legalName: string;
  tradeName: string;
  address: { cep: string; street: string; city: string; state: string; number: string; neighborhood: string };
  companyId: number | null;
};

/** Resultado do cadastro rápido do comprador. */
export type BuyerUpsertResult = {
  companyId: number;
  buyerUserId: number;
  created: { company: boolean; user: boolean };
};

/** Dados do comprador digitados no tablet. */
export type BuyerInput = { cnpj: string; name: string; phone: string; email: string };

/** Endereço de entrega do pedido. */
export type DeliveryInput = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

/** Corpo de `POST orders`. */
export type CreateOrderInput = {
  checkoutAttemptId: string;
  companyId: number;
  buyerUserId: number;
  items: QuoteItemInput[];
  kits: number;
  delivery: DeliveryInput;
  quoteFingerprint: string;
  method: EventPaymentMethod;
  /** Maquininha que recebe a cobrança; vazio usa a padrão do evento. */
  terminalId: string;
};

/** Dados da liberação manual pelo supervisor. */
export type ManualConfirmInput = { nsu: string; method: EventPaymentMethod; reason: string };
