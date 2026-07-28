"use client";

import { useState } from "react";

type ReceiptActionsProps = {
  orderId: string;
};

export function OrderReceiptActions({ orderId }: ReceiptActionsProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function sendReceipt() {
    setSending(true);
    setMessage("");

    try {
      const response = await fetch(`/api/profile/orders/${orderId}/receipt/email`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      setMessage(
        response.ok
          ? "Recibo enviado para o seu e-mail."
          : body?.message || "Não foi possível enviar o recibo agora.",
      );
    } catch {
      setMessage("Não foi possível enviar o recibo agora.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <a
        className="inline-flex h-10 w-full items-center justify-center rounded-full border border-brand-dark px-5 text-sm font-black uppercase tracking-[0.12em] text-brand-dark transition hover:bg-brand-dark hover:text-white"
        href={`/api/profile/orders/${orderId}/receipt`}
      >
        Baixar recibo
      </a>
      <button
        className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full bg-brand-dark px-5 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={sending}
        onClick={sendReceipt}
        type="button"
      >
        {sending ? "Enviando..." : "Enviar para meu e-mail"}
      </button>
      {message ? <p className="mt-2 text-center text-xs font-semibold text-brand-dark">{message}</p> : null}
    </div>
  );
}
