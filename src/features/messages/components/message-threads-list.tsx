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
            className="h-11 min-w-0 flex-1 rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none transition placeholder:text-[#1a1a1a]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            defaultValue={search}
            name="search"
            placeholder="Buscar por numero do pedido ou cliente"
          />
          <button
            className="cursor-pointer rounded-none border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none"
            type="submit"
          >
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
              className={`block rounded-xl border p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark ${
                active
                  ? "border-brand-dark bg-brand-yellow/45"
                  : "border-brand-dark/12 bg-white hover:border-brand-dark/30 hover:bg-brand-dark/2"
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
        <div className="rounded-xl border border-dashed border-brand-dark/16 bg-white/70 p-6 text-center text-sm text-brand-dark/55">
          Nenhuma conversa encontrada.
        </div>
      )}
    </div>
  );
}
