import type {
  MessageItem,
  MessageParticipant,
  MessageSenderRole,
  MessageThread,
  MessageThreadSummary,
  MessageThreadsSnapshot,
} from "../types/messages";

type WpMessageItem = {
  body?: unknown;
  created_at?: unknown;
  id?: unknown;
  is_mine?: unknown;
  sender_id?: unknown;
  sender_name?: unknown;
  sender_role?: unknown;
};

export type WpMessageThreadSummary = {
  counterpart_name?: unknown;
  escalated_at?: unknown;
  last_message?: WpMessageItem | null;
  order_id?: unknown;
  order_number?: unknown;
  thread_id?: unknown;
  unread_count?: unknown;
  updated_at?: unknown;
};

export type WpMessageThread = WpMessageThreadSummary & {
  messages?: WpMessageItem[];
  participants?: {
    customer?: { id?: unknown; name?: unknown };
    seller?: { id?: unknown; name?: unknown };
  };
  viewer_role?: unknown;
};

export type WpMessageThreadsSnapshot = {
  items?: WpMessageThreadSummary[];
  page?: unknown;
  per_page?: unknown;
  total?: unknown;
  total_pages?: unknown;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function role(value: unknown): MessageSenderRole {
  return value === "seller" || value === "administrator" ? value : "customer";
}

function participant(value: { id?: unknown; name?: unknown } | undefined): MessageParticipant {
  return {
    id: number(value?.id),
    name: text(value?.name, "Usuário"),
  };
}

export function mapMessage(raw: WpMessageItem): MessageItem {
  return {
    body: text(raw.body),
    createdAt: text(raw.created_at),
    id: number(raw.id),
    isMine: raw.is_mine === true,
    senderId: number(raw.sender_id),
    senderName: text(raw.sender_name, "Usuário"),
    senderRole: role(raw.sender_role),
  };
}

export function mapMessageThreadSummary(raw: WpMessageThreadSummary): MessageThreadSummary {
  return {
    counterpartName: text(raw.counterpart_name, "Atendimento"),
    escalatedAt: typeof raw.escalated_at === "string" && raw.escalated_at ? raw.escalated_at : null,
    lastMessage: raw.last_message ? mapMessage(raw.last_message) : null,
    orderId: number(raw.order_id),
    orderNumber: text(raw.order_number),
    threadId: number(raw.thread_id),
    unreadCount: number(raw.unread_count),
    updatedAt: text(raw.updated_at),
  };
}

export function mapMessageThread(raw: WpMessageThread): MessageThread {
  return {
    ...mapMessageThreadSummary(raw),
    messages: (raw.messages ?? []).map(mapMessage),
    participants: {
      customer: participant(raw.participants?.customer),
      seller: participant(raw.participants?.seller),
    },
    viewerRole: role(raw.viewer_role),
  };
}

export function mapMessageThreadsSnapshot(raw: WpMessageThreadsSnapshot): MessageThreadsSnapshot {
  return {
    items: (raw.items ?? []).map(mapMessageThreadSummary),
    page: number(raw.page) || 1,
    perPage: number(raw.per_page) || 20,
    total: number(raw.total),
    totalPages: number(raw.total_pages) || 1,
  };
}
