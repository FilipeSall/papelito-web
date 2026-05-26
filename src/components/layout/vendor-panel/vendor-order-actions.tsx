"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";

import { vendorStatusLabel } from "./vendor-order-status-badge";

const nextStatus: Partial<Record<VendorOrderStatus, VendorOrderStatus>> = {
  aguardando_envio: "em_separacao",
  em_separacao: "enviado",
  enviado: "entregue",
};

export function VendorOrderActions({ orderId, status }: { orderId: number; status: VendorOrderStatus }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const next = nextStatus[status];
  const canCancel = status === "aguardando_envio" || status === "em_separacao";

  function update(target: VendorOrderStatus) {
    if (target === "cancelado" && !window.confirm("Cancelar este atendimento? O cliente vera esta atualizacao.")) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const response = await fetch(`/api/vendor/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setFeedback(body?.message ?? "Nao foi possivel atualizar o status.");
        return;
      }

      router.refresh();
    });
  }

  if (!next && !canCancel) {
    return null;
  }

  return (
    <div className="mt-5 border-t border-brand-dark/10 pt-5">
      {feedback ? <p className="mb-3 rounded-[10px] bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{feedback}</p> : null}
      <div className="flex flex-wrap gap-3">
        {next ? (
          <button
            className="rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-yellow disabled:opacity-50"
            disabled={isPending}
            onClick={() => update(next)}
            type="button"
          >
            {isPending ? "Atualizando..." : `Marcar como ${vendorStatusLabel[next]}`}
          </button>
        ) : null}
        {canCancel ? (
          <button
            className="rounded-full border border-red-300 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-red-700 disabled:opacity-50"
            disabled={isPending}
            onClick={() => update("cancelado")}
            type="button"
          >
            Cancelar atendimento
          </button>
        ) : null}
      </div>
    </div>
  );
}
