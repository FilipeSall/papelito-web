"use client";

import { ArrowUp, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { MESSAGE_BODY_MAX_LENGTH, MESSAGE_POLL_INTERVAL_MS } from "../constants";
import {
  createMessageThread,
  escalateMessageThread,
  fetchMessageThread,
  markMessageThreadRead,
  sendThreadMessage,
} from "../services/message-client";
import type { MessageThread } from "../types/messages";

import { MessageList } from "./message-list";

type MessageThreadPanelProps = {
  canEscalate?: boolean;
  canStart?: boolean;
  initialThread: MessageThread | null;
  orderId?: number;
};

export function MessageThreadPanel({
  canEscalate = false,
  canStart = false,
  initialThread,
  orderId,
}: MessageThreadPanelProps) {
  const router = useRouter();
  const [threadId, setThreadId] = useState(initialThread?.threadId ?? null);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const fallbackData = threadId === initialThread?.threadId ? initialThread ?? undefined : undefined;
  const { data: thread, error, mutate } = useSWR(
    threadId ? `message-thread:${threadId}` : null,
    () => fetchMessageThread(threadId as number),
    {
      fallbackData,
      refreshInterval: MESSAGE_POLL_INTERVAL_MS,
      revalidateOnFocus: true,
    },
  );
  const latestMessageId = thread?.messages[thread.messages.length - 1]?.id ?? 0;

  useEffect(() => {
    if (!threadId || latestMessageId <= 0) return;

    let active = true;
    void markMessageThreadRead(threadId)
      .then((updated) => {
        if (active) void mutate(updated, false);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [latestMessageId, mutate, threadId]);

  const title = useMemo(() => {
    if (!thread) return "Conversa com o vendor";
    return `Pedido #${thread.orderNumber} - ${thread.counterpartName}`;
  }, [thread]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = body.trim();

    if (!message || isSending) return;

    setNotice(null);
    setIsSending(true);

    try {
      const updated =
        threadId !== null
          ? await sendThreadMessage(threadId, message)
          : await createMessageThread(orderId as number, message);
      setThreadId(updated.threadId);
      setBody("");
      await mutate(updated, false);
      router.refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Nao foi possivel enviar a mensagem.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleEscalate() {
    if (!threadId || isEscalating) return;

    setNotice(null);
    setIsEscalating(true);
    try {
      const updated = await escalateMessageThread(threadId);
      await mutate(updated, false);
      router.refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Nao foi possivel escalar o atendimento.");
    } finally {
      setIsEscalating(false);
    }
  }

  if (!thread && !canStart) {
    return (
      <div className="rounded-[20px] border-2 border-[#231f20] bg-[#fbf7ef] p-8 text-center shadow-[8px_8px_0_rgba(35,31,32,0.08)]">
        <p className="text-sm text-brand-dark/62">Conversa indisponivel.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[20px] border-2 border-[#231f20] bg-[#fbf7ef] shadow-[8px_8px_0_rgba(35,31,32,0.08)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-dark/10 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48">Atendimento</p>
          <h2 className="mt-1 text-base font-semibold text-brand-dark">{title}</h2>
        </div>
        {thread?.escalatedAt ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow px-3 py-1.5 text-xs font-semibold text-brand-dark">
            <ShieldCheck className="h-3.5 w-3.5" />
            Papelito acompanhando
          </span>
        ) : null}
      </header>

      <MessageList errored={Boolean(error)} messages={thread?.messages ?? []} />

      {notice ? (
        <p className="mx-5 mt-4 rounded-[12px] border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3 text-sm font-semibold text-[#c0392b]">
          {notice}
        </p>
      ) : null}

      <form className="space-y-3 border-t border-brand-dark/10 px-4 py-4 md:px-5" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="message-body">
          Mensagem
        </label>
        <textarea
          className="min-h-24 w-full resize-y rounded-[12px] border border-brand-dark/16 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
          id="message-body"
          maxLength={MESSAGE_BODY_MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escreva sua mensagem..."
          value={body}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {canEscalate && thread && !thread.escalatedAt ? (
            <button
              className="text-sm font-semibold text-brand-dark/65 underline decoration-brand-dark/25 underline-offset-4 transition hover:text-brand-dark disabled:opacity-50"
              disabled={isEscalating}
              onClick={handleEscalate}
              type="button"
            >
              {isEscalating ? "Acionando Papelito..." : "Nao resolveu? Falar com a Papelito"}
            </button>
          ) : (
            <span />
          )}
          <button
            className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] bg-brand-dark px-5 py-2.5 text-sm font-semibold text-brand-yellow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={isSending || !body.trim() || (!threadId && (!canStart || !orderId))}
            type="submit"
          >
            {isSending ? "Enviando..." : "Enviar"}
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
}
