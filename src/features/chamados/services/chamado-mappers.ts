import { normalizeRichTextDocument } from "@/features/rich-text";

import { CHAMADO_BODY_MAX_NODES } from "../constants";
import type {
  Chamado,
  ChamadoCapabilities,
  ChamadoContext,
  ChamadoMessage,
  ChamadoOrderContext,
  ChamadoOrderItem,
  ChamadoParticipant,
  ChamadoReasonCatalog,
  ChamadoReasonOption,
  ChamadoReturnRequest,
  ChamadoRole,
  ChamadoStatus,
  ChamadoSummary,
  ChamadosSnapshot,
} from "../types/chamado";

type WpChamadoMessage = {
  body?: unknown;
  content?: unknown;
  created_at?: unknown;
  id?: unknown;
  is_mine?: unknown;
  sender_id?: unknown;
  sender_name?: unknown;
  sender_role?: unknown;
};

type WpChamadoParticipant = {
  id?: unknown;
  name?: unknown;
  whatsapp_url?: unknown;
};

export type WpChamadoSummary = {
  closed_at?: unknown;
  closed_by_name?: unknown;
  context?: unknown;
  counterpart_name?: unknown;
  escalated_at?: unknown;
  is_chamado?: unknown;
  last_message?: WpChamadoMessage | null;
  opened_at?: unknown;
  order_id?: unknown;
  order_number?: unknown;
  reason?: unknown;
  reason_label?: unknown;
  status?: unknown;
  thread_id?: unknown;
  unread_count?: unknown;
  updated_at?: unknown;
};

export type WpChamadoOrder = {
  created_at?: unknown;
  id?: unknown;
  items?: unknown;
  items_total_count?: unknown;
  number?: unknown;
  payment_method_label?: unknown;
  shipping?: unknown;
  status?: unknown;
  status_label?: unknown;
  store_id?: unknown;
  store_label?: unknown;
  subtotal?: unknown;
  total?: unknown;
};

export type WpChamado = WpChamadoSummary & {
  capabilities?: {
    can_close?: unknown;
    can_escalate?: unknown;
    can_reply?: unknown;
    can_start_return?: unknown;
  };
  messages?: WpChamadoMessage[];
  order?: WpChamadoOrder | null;
  participants?: {
    customer?: WpChamadoParticipant;
    seller?: WpChamadoParticipant;
  };
  reason_other?: unknown;
  return_reason?: unknown;
  return_request?: { id?: unknown; status?: unknown } | null;
  viewer_role?: unknown;
};

export type WpChamadosSnapshot = {
  items?: WpChamadoSummary[];
  page?: unknown;
  per_page?: unknown;
  total?: unknown;
  total_pages?: unknown;
};

export type WpChamadoReasonCatalog = {
  reasons?: unknown;
  return_reasons?: unknown;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function number(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function role(value: unknown): ChamadoRole {
  return value === "seller" || value === "administrator" ? value : "customer";
}

const CHAMADO_CONTEXTS: readonly string[] = [
  "order",
  "pagarme_bank_account_update",
  "return",
];

/**
 * Contexto desconhecido vira `null`, nunca `"order"`.
 *
 * Coagir escondia a colisão: uma conversa sem pedido renderizava "Pedido #" vazio e linkava para
 * `/perfil/pedidos/0`. Devolver `null` obriga cada consumidor a tratar "não sei o que é isto".
 */
function context(value: unknown): ChamadoContext | null {
  return typeof value === "string" && CHAMADO_CONTEXTS.includes(value)
    ? (value as ChamadoContext)
    : null;
}

/**
 * Status desconhecido cai em `"encerrado"`: fail-closed. Mostrar o compositor num chamado que a
 * API vai recusar é pior que escondê-lo num chamado aberto.
 */
function status(value: unknown): ChamadoStatus {
  const normalized =
    typeof value === "string" ? value.trim().toUpperCase() : "";

  if (normalized === "ABERTO") return "aberto";
  if (normalized === "ENCERRADO") return "encerrado";

  return "encerrado";
}

function participant(
  raw: WpChamadoParticipant | undefined,
): ChamadoParticipant {
  const base: ChamadoParticipant = {
    id: number(raw?.id),
    name: text(raw?.name, "Usuário"),
  };

  return raw && "whatsapp_url" in raw
    ? { ...base, whatsappUrl: optionalText(raw.whatsapp_url) }
    : base;
}

function capabilities(raw: WpChamado["capabilities"]): ChamadoCapabilities {
  return {
    canClose: raw?.can_close === true,
    canEscalate: raw?.can_escalate === true,
    canReply: raw?.can_reply === true,
    canStartReturn: raw?.can_start_return === true,
  };
}

function orderItems(raw: unknown): ChamadoOrderItem[] {
  return Array.isArray(raw)
    ? raw.map((item) => {
        const entry = (item ?? {}) as Record<string, unknown>;
        return {
          id: text(entry.id),
          lineTotal: number(entry.line_total),
          name: text(entry.name, "Item"),
          quantity: number(entry.quantity),
        };
      })
    : [];
}

function order(
  raw: WpChamadoOrder | null | undefined,
): ChamadoOrderContext | null {
  if (!raw || typeof raw !== "object") return null;

  const number_ = text(raw.number);

  return number_ === ""
    ? null
    : {
        createdAt: text(raw.created_at),
        id: number(raw.id),
        items: orderItems(raw.items),
        itemsTotalCount: number(raw.items_total_count),
        number: number_,
        paymentMethodLabel: text(raw.payment_method_label),
        shipping: number(raw.shipping),
        status: text(raw.status),
        statusLabel: text(raw.status_label),
        storeId: number(raw.store_id),
        storeLabel: text(raw.store_label),
        subtotal: number(raw.subtotal),
        total: number(raw.total),
      };
}

function returnRequest(
  raw: WpChamado["return_request"],
): ChamadoReturnRequest | null {
  const id = number(raw?.id);

  return id > 0 ? { id, status: text(raw?.status) } : null;
}

export function mapChamadoMessage(raw: WpChamadoMessage): ChamadoMessage {
  return {
    content: normalizeRichTextDocument(raw.content, {
      maxNodes: CHAMADO_BODY_MAX_NODES,
    }),
    createdAt: text(raw.created_at),
    id: number(raw.id),
    isMine: raw.is_mine === true,
    plainText: text(raw.body),
    senderId: number(raw.sender_id),
    senderName: text(raw.sender_name, "Usuário"),
    senderRole: role(raw.sender_role),
  };
}

export function mapChamadoSummary(raw: WpChamadoSummary): ChamadoSummary {
  return {
    closedAt: optionalText(raw.closed_at),
    closedByName: optionalText(raw.closed_by_name),
    context: context(raw.context),
    counterpartName: text(raw.counterpart_name, "Atendimento"),
    escalatedAt: optionalText(raw.escalated_at),
    isChamado: raw.is_chamado === true,
    lastMessage: raw.last_message ? mapChamadoMessage(raw.last_message) : null,
    openedAt: text(raw.opened_at),
    orderId: number(raw.order_id),
    orderNumber: text(raw.order_number),
    reason: optionalText(raw.reason),
    reasonLabel: optionalText(raw.reason_label),
    status: status(raw.status),
    threadId: number(raw.thread_id),
    unreadCount: number(raw.unread_count),
    updatedAt: text(raw.updated_at),
  };
}

export function mapChamado(raw: WpChamado): Chamado {
  return {
    ...mapChamadoSummary(raw),
    capabilities: capabilities(raw.capabilities),
    messages: (raw.messages ?? []).map(mapChamadoMessage),
    order: order(raw.order),
    participants: {
      customer: participant(raw.participants?.customer),
      seller: participant(raw.participants?.seller),
    },
    reasonOther: optionalText(raw.reason_other),
    returnRequest: returnRequest(raw.return_request),
    returnReason: optionalText(raw.return_reason),
    viewerRole: role(raw.viewer_role),
  };
}

export function mapChamadosSnapshot(raw: WpChamadosSnapshot): ChamadosSnapshot {
  return {
    items: (raw.items ?? []).map(mapChamadoSummary),
    page: number(raw.page) || 1,
    perPage: number(raw.per_page) || 20,
    total: number(raw.total),
    totalPages: number(raw.total_pages) || 1,
  };
}

function reasonOptions(raw: unknown): ChamadoReasonOption[] {
  return Array.isArray(raw)
    ? raw
        .map((option) => {
          const entry = (option ?? {}) as Record<string, unknown>;
          return {
            label: text(entry.label),
            requiresDetail: entry.requires_detail === true,
            requiresReturnReason: entry.requires_return_reason === true,
            value: text(entry.value),
          };
        })
        .filter((option) => option.value !== "" && option.label !== "")
    : [];
}

export function mapChamadoReasonCatalog(
  raw: WpChamadoReasonCatalog,
): ChamadoReasonCatalog {
  return {
    reasons: reasonOptions(raw.reasons),
    returnReasons: reasonOptions(raw.return_reasons),
  };
}
