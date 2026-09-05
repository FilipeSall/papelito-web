"use client";

import { useRouter } from "next/navigation";
import { CircleCheck, Lock, TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";

import { FOCUS_RING, StatusChip } from "@/components/layout/operational-panel";
import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import {
  isVendorOrderTransitionOffered,
  vendorOrderNextAction,
  vendorOrderStatusShape,
  vendorOrderTransitionLabel,
} from "./order-status";
import { VendorCancelShipmentModal } from "./vendor-cancel-shipment-modal";
import { VendorOrderStatusStepper } from "./vendor-order-status-stepper";

const LOGISTICS_ONLY_NOTE =
  "Enviado e entregue são confirmados pelo rastreamento dos Correios — não existe botão para declará-los.";

/**
 * Situação do pedido e as transições que o backend realmente aceita.
 *
 * A lista de destinos vem pronta do WordPress (`next_statuses`): a tela não
 * recalcula a máquina de estados, então uma regra que mudar lá não deixa um
 * botão órfão aqui. Estado terminal não mostra caixa de ação vazia — mostra
 * por que acabou.
 */
export function VendorOrderStatusPanel({
  cancelReason,
  hasShipments,
  nextStatuses,
  orderId,
  status,
}: {
  cancelReason?: string;
  hasShipments: boolean;
  nextStatuses: VendorOrderStatus[];
  orderId: number;
  status: VendorOrderStatus;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pendingStatus, setPendingStatus] = useState<VendorOrderStatus | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  // O banner de feedback fica atrás do overlay do modal: sem um erro próprio, o
  // cancelamento recusado voltava o botão ao normal e não dizia nada.
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const shape = vendorOrderStatusShape(status);
  const isBusy = isPending || pendingStatus !== null;
  const offered = nextStatuses.filter(isVendorOrderTransitionOffered);
  const forward = offered.filter((target) => target !== "cancelado");
  const canCancel = offered.includes("cancelado");

  function updateStatus(target: VendorOrderStatus, reason?: string) {
    const isCancellation = target === "cancelado";

    // A guarda cobre duplo clique e o Enter repetido no teclado: a requisição
    // é uma escrita, e a segunda chegaria com o estado já mudado — 422 de
    // transição inválida, que o vendor leria como erro do sistema.
    if (isBusy) return;

    setPendingStatus(target);
    setFeedback(null);
    setCancelError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/vendor/orders/${orderId}/status`, {
          body: JSON.stringify(reason ? { reason, status: target } : { status: target }),
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        });
        const body = (await response.json().catch(() => null)) as { message?: string } | null;

        if (response.ok) {
          setIsCancelOpen(false);
          setFeedback({
            error: false,
            message: `✓ Pedido atualizado para ${vendorOrderStatusShape(target).label.toLowerCase()}.`,
          });
          router.refresh();
          return;
        }

        const message = body?.message ?? "Não foi possível atualizar o status.";

        setFeedback({
          error: true,
          hint:
            response.status === 409
              ? "Atualize a página: outra ação já moveu este pedido."
              : undefined,
          message: `⚠ ${message}`,
        });
        if (isCancellation) setCancelError(message);
      } catch {
        const message = "Não foi possível falar com o servidor. Verifique a conexão e tente de novo.";

        setFeedback({ error: true, message: `⚠ ${message}` });
        if (isCancellation) setCancelError(message);
      } finally {
        setPendingStatus(null);
      }
    });
  }

  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <div className="flex flex-col gap-3 border-b-2 border-[#1a1a1a] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55">
          Situação do pedido
        </h2>
        <StatusChip icon={shape.icon} label={shape.label} tone={shape.tone} />
      </div>

      <div className="px-5 py-5 md:px-6">
        <VendorOrderStatusStepper cancelReason={cancelReason} status={status} />

        <div className="mt-6 border-t-2 border-[#1a1a1a]/10 pt-5">
          <FeedbackBanner className="mb-4" feedback={feedback} />

          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
            Próxima ação
          </p>
          <p className="mt-2 text-sm leading-6 text-[#231f20]/74">{vendorOrderNextAction(status)}</p>

          {offered.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {forward.map((target) => (
                <button
                  className={[
                    "inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
                    FOCUS_RING,
                  ].join(" ")}
                  disabled={isBusy}
                  key={target}
                  onClick={() => updateStatus(target)}
                  type="button"
                >
                  {pendingStatus === target ? "Atualizando…" : vendorOrderTransitionLabel(target)}
                </button>
              ))}

              {canCancel ? (
                <button
                  className={[
                    "inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#c0392b] transition hover:bg-[#c0392b]/8 disabled:cursor-not-allowed disabled:opacity-45",
                    FOCUS_RING,
                  ].join(" ")}
                  disabled={isBusy}
                  onClick={() => {
                    setCancelError(null);
                    setIsCancelOpen(true);
                  }}
                  type="button"
                >
                  {vendorOrderTransitionLabel("cancelado")}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 inline-flex items-start gap-2 border-2 border-[#1a1a1a]/15 bg-white px-4 py-3 text-sm leading-6 text-[#231f20]/74">
              {status === "entregue" ? (
                <CircleCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
              ) : (
                <Lock aria-hidden className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
              )}
              <span>
                {status === "entregue" || status === "cancelado"
                  ? "Situação final: não há mais transição a executar neste pedido."
                  : "Nenhuma transição depende de você agora."}
              </span>
            </p>
          )}

          {canCancel && hasShipments ? (
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#231f20]/62">
              <TriangleAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
              Este pedido já tem pré-postagem: o cancelamento precisa passar pelo suporte para
              cancelar também nos Correios.
            </p>
          ) : null}

          <p className="mt-3 text-xs leading-5 text-[#231f20]/62">{LOGISTICS_ONLY_NOTE}</p>
        </div>
      </div>

      <VendorCancelShipmentModal
        errorMessage={cancelError}
        isSubmitting={isBusy}
        onClose={() => {
          setCancelError(null);
          setIsCancelOpen(false);
        }}
        onConfirm={(reason) => updateStatus("cancelado", reason)}
        open={isCancelOpen}
      />
    </section>
  );
}
