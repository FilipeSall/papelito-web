import type { RichTextDocument } from "@/features/rich-text";

export type ChamadoRole = "customer" | "seller" | "administrator";

export type ChamadoStatus = "aberto" | "encerrado";

/**
 * `null` quando o backend manda um contexto que este build não conhece. Coagir para `"order"`
 * faria a tela prometer um pedido que não existe.
 */
export type ChamadoContext = "order" | "pagarme_bank_account_update" | "return";

export type ChamadoMessage = {
  /** Corpo estruturado. `null` em mensagem de texto puro e nas linhas anteriores ao editor. */
  content: RichTextDocument | null;
  createdAt: string;
  id: number;
  isMine: boolean;
  /** Projeção plana: prévia de lista, notificação e fallback de renderização. */
  plainText: string;
  senderId: number;
  senderName: string;
  senderRole: ChamadoRole;
};

export type ChamadoOrderItem = {
  id: string;
  lineTotal: number;
  name: string;
  quantity: number;
};

export type ChamadoOrderContext = {
  createdAt: string;
  id: number;
  items: ChamadoOrderItem[];
  itemsTotalCount: number;
  number: string;
  paymentMethodLabel: string;
  shipping: number;
  status: string;
  statusLabel: string;
  storeId: number;
  storeLabel: string;
  subtotal: number;
  total: number;
};

/**
 * Autoridade do backend sobre o que este espectador pode fazer. A UI só renderiza — esconder um
 * botão é experiência, e a recusa de verdade é da API.
 */
export type ChamadoCapabilities = {
  canClose: boolean;
  canEscalate: boolean;
  canReply: boolean;
  canStartReturn: boolean;
};

export type ChamadoParticipant = {
  id: number;
  name: string;
  /** Só chega para quem não é o próprio vendor, e `null` quando não há telefone cadastrado. */
  whatsappUrl?: string | null;
};

export type ChamadoSummary = {
  closedAt: string | null;
  closedByName: string | null;
  context: ChamadoContext | null;
  counterpartName: string;
  escalatedAt: string | null;
  isChamado: boolean;
  lastMessage: ChamadoMessage | null;
  openedAt: string;
  orderId: number;
  orderNumber: string;
  /** Slug do motivo. String aberta de propósito: um motivo novo no backend não pode quebrar a tela. */
  reason: string | null;
  reasonLabel: string | null;
  status: ChamadoStatus;
  threadId: number;
  unreadCount: number;
  updatedAt: string;
};

/** Registro formal de devolução ligado ao chamado, quando o vendor já o abriu. */
export type ChamadoReturnRequest = {
  id: number;
  status: string;
};

export type Chamado = ChamadoSummary & {
  capabilities: ChamadoCapabilities;
  messages: ChamadoMessage[];
  order: ChamadoOrderContext | null;
  participants: {
    customer: ChamadoParticipant;
    seller: ChamadoParticipant;
  };
  reasonOther: string | null;
  returnRequest: ChamadoReturnRequest | null;
  returnReason: string | null;
  viewerRole: ChamadoRole;
};

export type ChamadosSnapshot = {
  items: ChamadoSummary[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type ChamadoReasonOption = {
  label: string;
  requiresDetail: boolean;
  requiresReturnReason: boolean;
  value: string;
};

export type ChamadoReasonCatalog = {
  reasons: ChamadoReasonOption[];
  returnReasons: ChamadoReasonOption[];
};
