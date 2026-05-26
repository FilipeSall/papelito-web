export type MessageSenderRole = "customer" | "seller" | "administrator";

export type MessageItem = {
  body: string;
  createdAt: string;
  id: number;
  isMine: boolean;
  senderId: number;
  senderName: string;
  senderRole: MessageSenderRole;
};

export type MessageThreadSummary = {
  counterpartName: string;
  escalatedAt: string | null;
  lastMessage: MessageItem | null;
  orderId: number;
  orderNumber: string;
  threadId: number;
  unreadCount: number;
  updatedAt: string;
};

export type MessageParticipant = {
  id: number;
  name: string;
};

export type MessageThread = MessageThreadSummary & {
  messages: MessageItem[];
  participants: {
    customer: MessageParticipant;
    seller: MessageParticipant;
  };
  viewerRole: MessageSenderRole;
};

export type MessageThreadsSnapshot = {
  items: MessageThreadSummary[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};
