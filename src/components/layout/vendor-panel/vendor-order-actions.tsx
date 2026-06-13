"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";

import { VendorCancelShipmentModal } from "./vendor-cancel-shipment-modal";

const nextStatus: Partial<Record<VendorOrderStatus, VendorOrderStatus>> = {
  aguardando_envio: "em_separacao",
  em_separacao: "enviado",
  enviado: "entregue",
};

const nextStatusLabel: Partial<Record<VendorOrderStatus, string>> = {
  aguardando_envio: "Marcar como separado",
  em_separacao: "Marcar como enviado",
  enviado: "Marcar como entregue",
};

const nextStatusPending: Partial<Record<VendorOrderStatus, string>> = {
  aguardando_envio: "Separando...",
  em_separacao: "Enviando...",
  enviado: "Concluindo...",
};

export function VendorOrderActions({ orderId, status }: { orderId: number; status: VendorOrderStatus }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const next = nextStatus[status];
  const canCancel = status === "aguardando_envio" || status === "em_separacao";

  function update(target: VendorOrderStatus, reason?: string) {
    setFeedback(null);
    setCancelError(null);
    startTransition(async () => {
      const response = await fetch(`/api/vendor/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reason ? { reason, status: target } : { status: target }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        const message = body?.message ?? "Nao foi possivel atualizar o status.";
        if (target === "cancelado") {
          setCancelError(message);
        } else {
          setFeedback({ tone: "error", message });
        }
        return;
      }

      setIsModalOpen(false);
      setFeedback({
        tone: "success",
        message: target === "cancelado" ? "Envio cancelado." : "Status atualizado.",
      });
      router.refresh();
    });
  }

  if (!next && !canCancel) {
    return null;
  }

  return (
    <div className="mt-5 border-t border-brand-dark/10 pt-5">
      {feedback ? (
        <p
          className={`mb-3 rounded-[10px] px-4 py-3 text-sm ${
            feedback.tone === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
          role="alert"
        >
          {feedback.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {next ? (
          <button
            className="cursor-pointer rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-yellow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            onClick={() => update(next)}
            type="button"
          >
            {isPending ? nextStatusPending[status] ?? "Atualizando..." : nextStatusLabel[status]}
          </button>
        ) : null}
        {canCancel ? (
          <button
            className="cursor-pointer rounded-full border border-red-300 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            onClick={() => {
              setCancelError(null);
              setIsModalOpen(true);
            }}
            type="button"
          >
            Cancelar envio
          </button>
        ) : null}
      </div>

      <VendorCancelShipmentModal
        errorMessage={cancelError}
        isSubmitting={isPending}
        onClose={() => setIsModalOpen(false)}
        onConfirm={(reason) => update("cancelado", reason)}
        open={isModalOpen}
      />
    </div>
  );
}
