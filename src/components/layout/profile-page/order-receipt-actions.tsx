"use client";

import { useState } from "react";

import { profilePrimaryActionClass, profileSecondaryActionClass } from "./profile-panel";

type ReceiptActionsProps = {
  orderId: string;
};

export function OrderReceiptActions({ orderId }: ReceiptActionsProps) {
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);

  async function sendReceipt() {
    setSending(true);
    setMessage("");
    setFailed(false);

    try {
      const response = await fetch(`/api/profile/orders/${orderId}/receipt/email`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      setFailed(!response.ok);
      setMessage(
        response.ok
          ? "Recibo enviado para o seu e-mail."
          : body?.message || "Não foi possível enviar o recibo agora.",
      );
    } catch {
      setFailed(true);
      setMessage("Não foi possível enviar o recibo agora.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <a
        className={`${profileSecondaryActionClass} w-full`}
        download
        href={`/api/profile/orders/${orderId}/receipt`}
      >
        Baixar recibo
      </a>
      <button
        className={`${profilePrimaryActionClass} mt-3 w-full`}
        disabled={sending}
        onClick={sendReceipt}
        type="button"
      >
        {sending ? "Enviando..." : "Enviar para meu e-mail"}
      </button>
      {message ? (
        <p
          className={`mt-3 text-center text-xs font-bold ${failed ? "text-[#c0392b]" : "text-[#1a1a1a]"}`}
          role={failed ? "alert" : "status"}
        >
          {failed ? "⚠ " : "✓ "}
          {message}
        </p>
      ) : null}
    </div>
  );
}
