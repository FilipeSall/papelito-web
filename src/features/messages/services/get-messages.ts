import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

import { MESSAGES_DEFAULT_PER_PAGE } from "../constants";
import {
  mapMessageThread,
  mapMessageThreadsSnapshot,
  type WpMessageThread,
  type WpMessageThreadsSnapshot,
} from "./message-mappers";
import type { MessageThread, MessageThreadsSnapshot } from "../types/messages";

async function getMessageAccessToken() {
  const session = await getServerSession(authOptions);
  return session?.accessToken ?? null;
}

export async function getMessageThreads({
  page = 1,
  search = "",
}: { page?: number; search?: string } = {}): Promise<MessageThreadsSnapshot> {
  const accessToken = await getMessageAccessToken();
  const empty = {
    items: [],
    page,
    perPage: MESSAGES_DEFAULT_PER_PAGE,
    total: 0,
    totalPages: 1,
  };

  if (!accessToken) return empty;

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(MESSAGES_DEFAULT_PER_PAGE),
  });
  if (search.trim()) params.set("search", search.trim());

  const result = await wpRest<WpMessageThreadsSnapshot>(
    `/papelito/v1/messages/threads?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, revalidate: 15, tags: ["vendor-messages"] },
  );

  return result.ok ? mapMessageThreadsSnapshot(result.data) : empty;
}

export async function getMessageThread(threadId: string | number): Promise<MessageThread | null> {
  const accessToken = await getMessageAccessToken();
  const id = String(threadId);

  if (!accessToken || !/^\d+$/.test(id)) return null;

  const result = await wpRest<WpMessageThread>(`/papelito/v1/messages/threads/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return result.ok ? mapMessageThread(result.data) : null;
}

export async function getOrderSupportThread(orderId: string): Promise<MessageThread | null> {
  const accessToken = await getMessageAccessToken();

  if (!accessToken || !/^\d+$/.test(orderId)) return null;

  const result = await wpRest<WpMessageThreadsSnapshot>(
    `/papelito/v1/messages/threads?order_id=${orderId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const first = result.ok ? result.data.items?.[0] : null;
  const threadId = first ? Number(first.thread_id) : 0;

  return Number.isInteger(threadId) && threadId > 0 ? getMessageThread(threadId) : null;
}
