import {
  mapMessageThread,
  type WpMessageThread,
} from "./message-mappers";
import type { MessageThread } from "../types/messages";

type ErrorPayload = {
  message?: string;
};

async function readThreadResponse(response: Response): Promise<MessageThread> {
  const body = (await response.json().catch(() => null)) as WpMessageThread | ErrorPayload | null;

  if (!response.ok) {
    const message =
      body && "message" in body && typeof body.message === "string"
        ? body.message
        : "Não foi possível atualizar a conversa.";
    throw new Error(message);
  }

  return mapMessageThread((body ?? {}) as WpMessageThread);
}

export async function fetchMessageThread(threadId: number): Promise<MessageThread> {
  return readThreadResponse(await fetch(`/api/messages/threads/${threadId}`, { cache: "no-store" }));
}

export async function createMessageThread(orderId: number, body: string): Promise<MessageThread> {
  return readThreadResponse(
    await fetch("/api/messages/threads", {
      body: JSON.stringify({ order_id: orderId, body }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

export async function sendThreadMessage(threadId: number, body: string): Promise<MessageThread> {
  return readThreadResponse(
    await fetch(`/api/messages/threads/${threadId}`, {
      body: JSON.stringify({ body }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

export async function markMessageThreadRead(threadId: number): Promise<MessageThread> {
  return readThreadResponse(
    await fetch(`/api/messages/threads/${threadId}/read`, {
      method: "PUT",
    }),
  );
}

export async function escalateMessageThread(threadId: number): Promise<MessageThread> {
  return readThreadResponse(
    await fetch(`/api/messages/threads/${threadId}/escalate`, {
      method: "POST",
    }),
  );
}
