import Link from "next/link";

import type { MessageThreadSummary } from "../types/messages";
import { messageDateLabel } from "../utils/date-label";

type MessageThreadsListProps = {
  context: "admin" | "vendor";
  items: MessageThreadSummary[];
  search?: string;
  selectedThreadId?: number | null;
};

export function MessageThreadsList({
  context,
  items,
  search = "",
  selectedThreadId = null,
}: MessageThreadsListProps) {
  return (
    <div className="space-y-3">
      {context === "vendor" ? (
        <form action="/vendor/mensagens" className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-brand-dark/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            defaultValue={search}
            name="search"
            placeholder="Buscar por numero do pedido ou cliente"
          />
          <button className="rounded-xl bg-brand-dark px-4 text-sm font-semibold text-brand-yellow" type="submit">
            Buscar
          </button>
        </form>
      ) : null}

      {items.length ? (
        items.map((thread) => {
          const href =
            context === "admin"
              ? `/admin/suporte?thread=${thread.threadId}`
              : `/vendor/mensagens/${thread.threadId}`;
          const active = thread.threadId === selectedThreadId;
          return (
            <Link
              className={`block rounded-[16px] border p-4 transition ${
                active
                  ? "border-brand-dark bg-brand-yellow/45"
                  : "border-brand-dark/10 bg-white hover:border-brand-dark/30"
              }`}
              href={href}
              key={thread.threadId}
            >
              <div className="flex justify-between gap-3">
                <p className="text-sm font-semibold text-brand-dark">
                  Pedido #{thread.orderNumber}
                </p>
                {thread.unreadCount > 0 ? (
                  <span className="rounded-full bg-brand-dark px-2 py-0.5 text-xs font-semibold text-brand-yellow">
                    {thread.unreadCount}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-brand-dark/65">{thread.counterpartName}</p>
              <p className="mt-2 line-clamp-2 text-sm text-brand-dark/52">
                {thread.lastMessage?.body ?? "Sem mensagem"}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-brand-dark/45">
                <span>{messageDateLabel(thread.updatedAt)}</span>
                {thread.escalatedAt ? <span className="font-semibold">Escalada</span> : null}
              </div>
            </Link>
          );
        })
      ) : (
        <div className="rounded-[16px] border border-dashed border-brand-dark/15 bg-white/70 p-6 text-center text-sm text-brand-dark/55">
          Nenhuma conversa encontrada.
        </div>
      )}
    </div>
  );
}
