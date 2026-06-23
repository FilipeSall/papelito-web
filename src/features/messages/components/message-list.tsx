import { MessageSquareMore } from "lucide-react";

import type { MessageItem, MessageSenderRole } from "../types/messages";
import { messageDateLabel } from "../utils/date-label";

function roleLabel(role: MessageSenderRole) {
  if (role === "administrator") return "Papelito";
  if (role === "seller") return "Vendor";
  return "Cliente";
}

export function MessageList({
  errored = false,
  messages,
}: {
  errored?: boolean;
  messages: MessageItem[];
}) {
  if (errored) {
    return (
      <div className="max-h-120 min-h-64 space-y-3 overflow-y-auto bg-[#f6f2e8] px-4 py-5 md:px-5">
        <p className="rounded-[12px] border-2 border-[#c0392b] bg-[#c0392b]/10 p-4 text-sm font-semibold text-[#c0392b]">
          Nao foi possivel atualizar a conversa.
        </p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="max-h-120 min-h-64 space-y-3 overflow-y-auto bg-[#f6f2e8] px-4 py-5 md:px-5">
        <div className="flex min-h-52 flex-col items-center justify-center text-center">
          <MessageSquareMore className="h-9 w-9 text-brand-dark/30" />
          <p className="mt-3 text-sm font-semibold text-brand-dark">Nenhuma mensagem enviada</p>
          <p className="mt-1 max-w-sm text-sm text-brand-dark/55">
            Descreva sua duvida sobre o pedido para iniciar o atendimento com o vendor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-120 min-h-64 space-y-3 overflow-y-auto bg-[#f6f2e8] px-4 py-5 md:px-5">
      {messages.map((message) => (
        <article
          className={`max-w-[84%] rounded-xl px-4 py-3 ${
            message.isMine
              ? "ml-auto bg-brand-dark text-white"
              : "border border-brand-dark/12 bg-white text-brand-dark"
          }`}
          key={message.id}
        >
          <div className={`flex items-center gap-2 text-[11px] ${message.isMine ? "text-white/60" : "text-brand-dark/48"}`}>
            <span className="font-semibold">{message.senderName}</span>
            <span>{roleLabel(message.senderRole)}</span>
            <span>{messageDateLabel(message.createdAt)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
        </article>
      ))}
    </div>
  );
}
