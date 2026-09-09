"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ProfileOrderReturnEligibility } from "@/features/orders/types/profile-order-detail";

import { profileSecondaryActionClass } from "./profile-panel";

const BLOCKED_HEADLINES: Record<string, string> = {
  papelito_return_delivery_required: "Disponível após a entrega",
  papelito_return_window_expired: "Prazo encerrado",
  papelito_return_item_already_requested: "Devolução já registrada",
};

function formatDeadline(value: string) {
  if (!value) return "";
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(date);
}

/**
 * A devolução começa como conversa com o vendor, não como formulário: o cliente
 * cai no suporte do pedido com a mensagem já redigida e só precisa completar o
 * motivo. Quem abre o registro formal é o vendor, depois de combinar ali.
 */
export function OrderReturnRequest({
  orderId,
  returns,
}: Readonly<{ orderId: string; returns: ProfileOrderReturnEligibility }>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openReturnSupport() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/messages/return-support", {
        body: JSON.stringify({ orderId: Number(orderId) }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.message ?? "Não foi possível abrir o suporte da devolução.");
        return;
      }
      router.push(`/perfil/pedidos/${orderId}/suporte`);
      router.refresh();
    } catch {
      setError("Não foi possível falar com o servidor. Verifique sua conexão.");
    } finally {
      setBusy(false);
    }
  }

  if (!returns.canRequest) {
    const headline = returns.reason ? BLOCKED_HEADLINES[returns.reason] : undefined;
    if (!headline) return null;

    return (
      <div className="border-2 border-[#1a1a1a]/25 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1a1a1a]">{headline}</p>
        <p className="mt-2 text-xs font-bold leading-5 text-[#1a1a1a]/70">{returns.message}</p>
      </div>
    );
  }

  const deadline = formatDeadline(returns.windowEndsAt);

  return (
    <div className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[8px_8px_0px_#1a1a1a]">
      <p className="text-base font-black uppercase tracking-tight text-[#1a1a1a]">Devolução</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/75">
        {deadline ? `Você tem até ${deadline}` : `Prazo de ${returns.windowDays} dias após a entrega`}
      </p>
      <p className="mt-3 text-xs font-semibold leading-5 text-[#1a1a1a]/70">
        Abriremos agora um chamado direto com o vendor, já preenchido com os dados do pedido e dos itens
        disponíveis. Você poderá complementar o motivo na conversa.
      </p>
      <button
        className={`${profileSecondaryActionClass} mt-4 w-full`}
        disabled={busy}
        onClick={() => void openReturnSupport()}
        type="button"
      >
        {busy ? "Abrindo chamado..." : "Solicitar devolução"}
      </button>
      {error ? <p className="mt-3 text-xs font-bold text-[#c0392b]">⚠ {error}</p> : null}
    </div>
  );
}
