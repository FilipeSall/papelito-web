"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type {
  VendorOrderLogistics,
  VendorOrderStatus,
} from "@/features/vendor-orders/types/vendor-orders";

import { VendorCancelShipmentModal } from "./vendor-cancel-shipment-modal";

const nextStatus: Partial<Record<VendorOrderStatus, VendorOrderStatus>> = {
  aguardando_envio: "em_separacao",
};

const nextStatusLabel: Partial<Record<VendorOrderStatus, string>> = {
  aguardando_envio: "Marcar como separado",
};

const nextStatusPending: Partial<Record<VendorOrderStatus, string>> = {
  aguardando_envio: "Separando...",
};

const shipmentErrorMessages: Record<string, string> = {
  papelito_correios_credentials_invalid: "As credenciais dos Correios precisam ser atualizadas pelo suporte.",
  papelito_correios_generation_in_progress: "A etiqueta ja esta sendo gerada. Aguarde alguns instantes.",
  papelito_correios_generation_uncertain: "A tentativa anterior precisa ser conferida pelo suporte antes de gerar outra etiqueta.",
  papelito_correios_integration_not_configured: "A geracao automatica ainda nao esta configurada para este vendor.",
  papelito_correios_mock_forbidden_outside_local: "O modo de testes foi bloqueado neste ambiente.",
  papelito_correios_dev_health_unhealthy: "A verificacao local indicou que a integracao nao esta disponivel.",
  papelito_correios_dev_health_unknown: "Nao foi possivel confirmar a saude da integracao no teste local.",
  papelito_correios_service_not_authorized: "A chave configurada nao tem permissao para gerar etiquetas.",
  papelito_correios_service_not_contracted: "O contrato ou cartao nao possui a API de Pre-Postagem.",
  papelito_correios_unavailable: "Os Correios estao temporariamente indisponiveis. Tente novamente mais tarde.",
  papelito_tracking_shipment_exists: "Este pedido ja possui uma etiqueta ou codigo de rastreamento.",
};

export function VendorOrderActions({
  generationErrorCode,
  generationStatus,
  hasShipment,
  manualFallbackAvailable,
  manualRegistrationEnabled,
  orderId,
  status,
}: {
  generationErrorCode: string;
  generationStatus: VendorOrderLogistics["generationStatus"];
  hasShipment: boolean;
  manualFallbackAvailable: boolean;
  manualRegistrationEnabled: boolean;
  orderId: number;
  status: VendorOrderStatus;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [manualFallbackOpen, setManualFallbackOpen] = useState(manualFallbackAvailable);
  const [currentGenerationErrorCode, setCurrentGenerationErrorCode] = useState(generationErrorCode);
  const [isPending, startTransition] = useTransition();
  const next = nextStatus[status];
  const canCancel = !hasShipment && (status === "aguardando_envio" || status === "em_separacao");
  const generationBlocked = generationStatus === "generating" || generationStatus === "uncertain";
  const canGenerateShipment = status === "em_separacao" && !hasShipment && !generationBlocked && !manualFallbackOpen;
  const canRegisterManual = manualRegistrationEnabled && manualFallbackOpen && status === "em_separacao" && !hasShipment && !generationBlocked;
  const isLocalHealthFallback = currentGenerationErrorCode.startsWith("papelito_correios_dev_health_");
  const canRetryMock = canRegisterManual && isLocalHealthFallback;

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

  function generateShipment() {
    setFeedback(null);
    startTransition(async () => {
      const response = await fetch(`/api/vendor/orders/${orderId}/shipments`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as {
        code?: string;
        manual_fallback_available?: boolean;
        message?: string;
        shipments?: Array<{ provider?: string }>;
      } | null;

      if (!response.ok) {
        const fallbackAvailable = Boolean(body?.manual_fallback_available);
        setManualFallbackOpen(fallbackAvailable);
        setCurrentGenerationErrorCode(body?.code ?? "");
        setFeedback({
          tone: "error",
          message: (body?.code && shipmentErrorMessages[body.code]) || body?.message || "Nao foi possivel gerar a etiqueta dos Correios.",
        });
        return;
      }

      const isMock = body?.shipments?.some((shipment) => shipment.provider === "mock");
      setManualFallbackOpen(false);
      setCurrentGenerationErrorCode("");
      setFeedback({
        tone: "success",
        message: isMock
          ? "Etiqueta de teste gerada. O PDF esta marcado como SEM VALIDADE e nenhuma chamada aos Correios foi feita."
          : "Etiqueta gerada e rastreamento iniciado.",
      });
      router.refresh();
    });
  }

  function retryMockGeneration() {
    setFeedback(null);
    startTransition(async () => {
      const response = await fetch(`/api/vendor/orders/${orderId}/shipments/retry-mock`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as {
        code?: string;
        manual_fallback_available?: boolean;
        message?: string;
        shipments?: Array<{ provider?: string }>;
      } | null;
      if (!response.ok) {
        setManualFallbackOpen(Boolean(body?.manual_fallback_available) || manualFallbackOpen);
        setCurrentGenerationErrorCode(body?.code ?? currentGenerationErrorCode);
        setFeedback({
          tone: "error",
          message: (body?.code && shipmentErrorMessages[body.code]) || body?.message || "Nao foi possivel repetir o teste local.",
        });
        return;
      }
      setManualFallbackOpen(false);
      setCurrentGenerationErrorCode("");
      setFeedback({ tone: "success", message: "Etiqueta de teste gerada sem criar uma postagem real." });
      router.refresh();
    });
  }

  function registerManualTracking() {
    setFeedback(null);
    const normalized = trackingCode.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(normalized)) {
      setFeedback({ tone: "error", message: "Informe um codigo S10 valido, como AA123456789BR." });
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/vendor/orders/${orderId}/shipments/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingCode: normalized }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setFeedback({ tone: "error", message: body?.message ?? "Nao foi possivel cadastrar o rastreamento." });
        return;
      }
      setTrackingCode("");
      setManualFallbackOpen(false);
      setFeedback({ tone: "success", message: "Codigo cadastrado e associado ao pedido." });
      router.refresh();
    });
  }

  if (!next && !canCancel && !canGenerateShipment && !canRegisterManual) {
    return null;
  }

  return (
    <div className="mt-5 border-t border-brand-dark/10 pt-5">
      {feedback ? (
        <p
          className={`mb-3 rounded-[10px] border px-4 py-3 text-sm font-semibold ${
            feedback.tone === "success"
              ? "border-[#97b38e] bg-[#e4efe0] text-[#28422d]"
              : "border-[#c0392b] bg-[#c0392b]/10 text-[#c0392b]"
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
        {canGenerateShipment ? (
          <button
            className="cursor-pointer rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-yellow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            onClick={generateShipment}
            type="button"
          >
            {isPending ? "Gerando etiqueta..." : "Gerar etiqueta dos Correios"}
          </button>
        ) : null}
        {canCancel ? (
          <button
            className="cursor-pointer rounded-full border border-[#c0392b] bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#c0392b] transition hover:bg-[#c0392b]/10 disabled:cursor-not-allowed disabled:opacity-50"
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

      {canRegisterManual ? (
        <section className="mt-4 rounded-xl border border-brand-dark/15 bg-brand-dark/3 p-4" aria-labelledby="manual-tracking-title">
          <h3 className="text-sm font-bold text-brand-dark" id="manual-tracking-title">
            Cadastro manual do rastreamento
          </h3>
          <p className="mt-2 text-sm font-semibold text-[#8f2f25]">
            {shipmentErrorMessages[currentGenerationErrorCode] ?? "Nao foi possivel gerar a etiqueta automaticamente."}
          </p>
          <p className="mt-2 text-sm leading-6 text-brand-dark/70">
            {isLocalHealthFallback
              ? "Para continuar o teste local pelo fluxo manual:"
              : "Conclua estes passos antes de informar o codigo:"}
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-brand-dark/70">
            {isLocalHealthFallback ? (
              <>
                <li>Informe um codigo S10 de teste com 13 caracteres, como AA123456789BR.</li>
                <li>Cadastre o codigo para validar as telas e os estados locais.</li>
                <li>Nao use esse codigo para uma postagem real.</li>
              </>
            ) : (
              <>
                <li>Gere a etiqueta no portal dos Correios ou leve o pacote e os documentos a uma agencia.</li>
                <li>Use o mesmo servico escolhido no pedido, PAC ou SEDEX.</li>
                <li>Copie o codigo S10 de 13 caracteres da etiqueta ou do comprovante.</li>
              </>
            )}
          </ol>
          <p className="mt-2 text-xs leading-5 text-brand-dark/55">
            {isLocalHealthFallback
              ? "Esse codigo ficara marcado como teste e nao sera enviado ao rastreamento real dos Correios."
              : "Custos e documentos da postagem manual sao tratados diretamente no canal dos Correios."}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs font-semibold uppercase tracking-widest text-brand-dark/60">
              Codigo de rastreamento
              <input
                aria-describedby="manual-tracking-title"
                className="mt-2 w-full rounded-xl border border-brand-dark/20 bg-white px-4 py-3 font-mono text-sm uppercase tracking-[0.08em] outline-none transition focus:border-brand-dark"
                disabled={isPending}
                maxLength={13}
                onChange={(event) => setTrackingCode(event.target.value)}
                placeholder="AA123456789BR"
                type="text"
                value={trackingCode}
              />
            </label>
            <button
              className="cursor-pointer rounded-full border border-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-dark transition hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
              onClick={registerManualTracking}
              type="button"
            >
              {isPending ? "Salvando..." : "Cadastrar rastreamento"}
            </button>
          </div>
          {canRetryMock ? (
            <button
              className="mt-3 cursor-pointer text-sm font-semibold text-brand-dark underline decoration-brand-dark/30 underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
              onClick={retryMockGeneration}
              type="button"
            >
              Tentar geracao simulada novamente
            </button>
          ) : null}
        </section>
      ) : null}

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
