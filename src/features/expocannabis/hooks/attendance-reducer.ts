import type {
  BuyerLookup,
  BuyerUpsertResult,
  DeliveryInput,
  EventOrderStatus,
  EventPaymentMethod,
} from "../types/order";
import type { EventQuote } from "../types/quote";

/** Tela do atendimento: 1 CNPJ, 2 loja, 3 dados, 4 pagamento, 5 confirmado. */
export type AttendanceScreen = 1 | 2 | 3 | 4 | 5;

/** Entrega no endereço da Receita ou em outro. */
export type DeliveryMode = "cnpj" | "other";

/** Contato do lojista digitado na tela 3. */
export type AttendanceContact = { name: string; phone: string; email: string };

/** Atendimento inteiro, persistido no tablet até "Novo pedido", CNPJ novo ou inatividade. */
export type AttendanceState = {
  screen: AttendanceScreen;
  buyer: BuyerLookup | null;
  registered: BuyerUpsertResult | null;
  qty: Record<number, number>;
  kits: number;
  contact: AttendanceContact;
  delivery: DeliveryInput & { mode: DeliveryMode };
  quote: EventQuote | null;
  method: EventPaymentMethod;
  checkoutAttemptId: string | null;
  order: EventOrderStatus | null;
  maxLevelIndex: number;
  lead: boolean;
  stockIssues: { productId: number; available: number }[];
};

/** Ações do atendimento. */
export type AttendanceAction =
  | { type: "start"; buyer: BuyerLookup }
  | { type: "switch-buyer"; buyer: BuyerLookup }
  | { type: "change-store" }
  | { type: "go"; screen: AttendanceScreen }
  | { type: "set-qty"; productId: number; qty: number }
  | { type: "set-kits"; kits: number }
  | { type: "set-cart"; qty: Record<number, number>; kits: number }
  | { type: "set-contact"; contact: Partial<AttendanceContact> }
  | { type: "set-delivery"; delivery: Partial<AttendanceState["delivery"]> }
  | { type: "set-registered"; registered: BuyerUpsertResult }
  | { type: "set-quote"; quote: EventQuote | null }
  | { type: "set-method"; method: EventPaymentMethod }
  | { type: "set-checkout-id"; id: string }
  | { type: "set-order"; order: EventOrderStatus | null }
  | { type: "level-reached"; index: number }
  | { type: "set-lead" }
  | { type: "clear-charge" }
  | { type: "stock-issue"; products: { productId: number; available: number }[] }
  | { type: "reset" };

const MAX_QTY = 999;
const MAX_KITS = 3;

/** Atendimento vazio, na tela do CNPJ. */
export function initialAttendance(): AttendanceState {
  return {
    screen: 1,
    buyer: null,
    registered: null,
    qty: {},
    kits: 0,
    contact: { name: "", phone: "", email: "" },
    delivery: { mode: "cnpj", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" },
    quote: null,
    method: "card",
    checkoutAttemptId: null,
    order: null,
    maxLevelIndex: 0,
    lead: false,
    stockIssues: [],
  };
}

function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.trunc(value)));
}

function withQty(qty: Record<number, number>, productId: number, value: number): Record<number, number> {
  const next = { ...qty };
  const clamped = clamp(value, MAX_QTY);
  if (clamped === 0) {
    delete next[productId];
  } else {
    next[productId] = clamped;
  }
  return next;
}

function startAttendance(buyer: BuyerLookup): AttendanceState {
  const base = initialAttendance();
  return {
    ...base,
    screen: 2,
    buyer,
    delivery: {
      ...base.delivery,
      cep: buyer.address.cep,
      street: buyer.address.street,
      city: buyer.address.city,
      state: buyer.address.state,
    },
  };
}

/** Reducer do atendimento. Mudança no carrinho invalida a cotação. */
export function attendanceReducer(state: AttendanceState, action: AttendanceAction): AttendanceState {
  switch (action.type) {
    case "start":
      return startAttendance(action.buyer);
    case "switch-buyer":
      return { ...startAttendance(action.buyer), qty: state.qty, kits: state.kits, maxLevelIndex: state.maxLevelIndex };
    case "change-store":
      return { ...state, screen: 1, quote: null, registered: null };
    case "go":
      return { ...state, screen: action.screen };
    case "set-qty":
      return { ...state, qty: withQty(state.qty, action.productId, action.qty), quote: null, stockIssues: [] };
    case "set-kits":
      return { ...state, kits: clamp(action.kits, MAX_KITS), quote: null };
    case "set-cart":
      return { ...state, qty: { ...action.qty }, kits: clamp(action.kits, MAX_KITS), quote: null, stockIssues: [] };
    case "set-contact":
      return { ...state, contact: { ...state.contact, ...action.contact } };
    case "set-delivery":
      return { ...state, delivery: { ...state.delivery, ...action.delivery }, quote: null };
    case "set-registered":
      return { ...state, registered: action.registered };
    case "set-quote":
      return { ...state, quote: action.quote };
    case "set-method":
      return { ...state, method: action.method };
    case "set-checkout-id":
      return { ...state, checkoutAttemptId: action.id };
    case "set-order":
      return { ...state, order: action.order };
    case "level-reached":
      return { ...state, maxLevelIndex: Math.max(state.maxLevelIndex, action.index) };
    case "set-lead":
      return { ...state, lead: true };
    case "clear-charge":
      return { ...state, order: null, checkoutAttemptId: null };
    case "stock-issue":
      return { ...state, screen: 2, quote: null, stockIssues: action.products };
    case "reset":
      return initialAttendance();
  }
}
