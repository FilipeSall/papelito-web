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
  papelito_correios_generation_uncertain: "A solicitacao anterior esta sendo verificada para evitar uma etiqueta duplicada.",
  papelito_correios_integration_not_configured: "A geracao automatica ainda nao esta configurada para este vendor.",
  papelito_correios_mock_forbidden_outside_local: "O modo de testes foi bloqueado neste ambiente.",
  papelito_correios_dev_health_unhealthy: "A verificacao local indicou que a integracao nao esta disponivel.",
  papelito_correios_dev_health_unknown: "Nao foi possivel confirmar a saude da integracao no teste local.",
  papelito_correios_service_not_authorized: "A chave configurada nao tem permissao para gerar etiquetas.",
  papelito_correios_service_not_contracted: "O contrato ou cartao nao possui a API de Pre-Postagem.",
  papelito_correios_unavailable: "Os Correios estao temporariamente indisponiveis. Tente novamente mais tarde.",
  papelito_support_manual_release: "O suporte liberou o cadastro manual depois de revisar a tentativa anterior.",
  papelito_tracking_shipment_exists: "Este pedido ja possui uma etiqueta ou codigo de rastreamento.",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ShipmentDisclaimer({
  generationStatus,
  manualFallbackOpen,
  supportReviewRequired,
}: {
  generationStatus: VendorOrderLogistics["generationStatus"];
  manualFallbackOpen: boolean;
  supportReviewRequired: boolean;
}) {
  if (manualFallbackOpen && !supportReviewRequired) {
    return (
      <section
        aria-labelledby="shipping-label-disclaimer"
        className="rounded-xl border border-[#c6922e]/45 bg-[#fff7df] p-4 text-sm text-[#5b4214]"
      >
        <h3 className="font-bold text-[#3d2b0c]" id="shipping-label-disclaimer">Cadastro manual liberado</h3>
        <p className="mt-2 leading-6">
          A geracao automatica nao pode continuar com seguranca e o cadastro manual foi liberado para este pedido. Antes de criar outra postagem fora da plataforma, confirme que nao existe uma etiqueta anterior para o mesmo pacote.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 leading-6">
          <li>Gere a postagem no portal dos Correios, PPN ou agencia autorizada.</li>
          <li>Use o servico escolhido para o pedido sempre que possivel.</li>
          <li>Informe o codigo S10, a data, a etiqueta ou URL e uma observacao.</li>
          <li>Guarde o comprovante de postagem ate a entrega.</li>
        </ol>
      </section>
    );
  }

  if (generationStatus === "uncertain" || generationStatus === "generating") {
    return (
      <section
        aria-labelledby="shipping-label-disclaimer"
        className="rounded-xl border border-[#7b95bb]/45 bg-[#eef5ff] p-4 text-sm text-[#233b5d]"
      >
        <h3 className="font-bold text-[#152944]" id="shipping-label-disclaimer">
          {supportReviewRequired ? "Revisao do suporte necessaria" : "Verificando a solicitacao enviada"}
        </h3>
        <p className="mt-2 leading-6">
          {supportReviewRequired
            ? "A tentativa anterior nao pode ser resolvida automaticamente. O suporte precisa revisar o caso antes de liberar uma nova geracao ou o cadastro manual."
            : "A solicitacao foi enviada, mas o sistema ainda nao confirmou o resultado. Uma nova geracao esta temporariamente bloqueada para evitar etiquetas duplicadas. A verificacao acontece automaticamente e a pagina sera atualizada em alguns instantes."}
        </p>
      </section>
    );
  }

  if (generationStatus === "generated") {
    return null;
  }

  return (
    <section
      aria-labelledby="shipping-label-disclaimer"
      className="rounded-xl border border-[#9bb3bf]/40 bg-[#f1f7f8] p-4 text-sm text-[#26404a]"
    >
      <h3 className="font-bold text-[#18313b]" id="shipping-label-disclaimer">Antes de gerar a etiqueta</h3>
      <p className="mt-2 leading-6">
        A etiqueta dos Correios contem os dados usados para identificar e encaminhar o pacote. Gere somente quando o pedido estiver embalado e pronto para postagem.
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 leading-6">
        <li>Confirme os dados do pedido.</li>
        <li>Embale corretamente o produto.</li>
        <li>Gere e imprima a etiqueta.</li>
        <li>Fixe a etiqueta na embalagem.</li>
        <li>Leve o pacote aos Correios ou ponto autorizado.</li>
        <li>Guarde o comprovante de postagem.</li>
      </ol>
    </section>
  );
}

export function VendorOrderActions({
  generationErrorCode,
  generationStatus,
  hasShipment,
  manualFallbackAvailable,
  manualRegistrationEnabled,
  orderId,
  shippingService,
  status,
  supportReviewRequired,
}: {
  generationErrorCode: string;
  generationStatus: VendorOrderLogistics["generationStatus"];
  hasShipment: boolean;
  manualFallbackAvailable: boolean;
  manualRegistrationEnabled: boolean;
  orderId: number;
  shippingService: string;
  status: VendorOrderStatus;
  supportReviewRequired: boolean;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [serviceCode, setServiceCode] = useState(shippingService);
  const [postedAt, setPostedAt] = useState(today);
  const [manualNote, setManualNote] = useState("");
  const [labelUrl, setLabelUrl] = useState("");
  const [manualFallbackOpen, setManualFallbackOpen] = useState(manualFallbackAvailable);
  const [currentGenerationErrorCode, setCurrentGenerationErrorCode] = useState(generationErrorCode);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || activeAction !== null;
  const next = nextStatus[status];
  const canCancel = !hasShipment && (status === "aguardando_envio" || status === "em_separacao");
  const generationBlocked = generationStatus === "generating" || generationStatus === "uncertain";
  const canGenerateShipment = status === "em_separacao" && !hasShipment && !generationBlocked && !manualFallbackOpen;
  const canRegisterManual = manualRegistrationEnabled && manualFallbackOpen && !supportReviewRequired && status === "em_separacao" && !hasShipment && !generationBlocked;
  const isLocalHealthFallback = currentGenerationErrorCode.startsWith("papelito_correios_dev_health_");
  const canRetryMock = canRegisterManual && isLocalHealthFallback;
  const showDisclaimer = status === "em_separacao" && (generationStatus !== "generated" || canRegisterManual || generationBlocked);

  function update(target: VendorOrderStatus, reason?: string) {
    setFeedback(null);
    setCancelError(null);
    setActiveAction("status");
    startTransition(async () => {
      try {
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
      } finally {
        setActiveAction(null);
      }
    });
  }

  function generateShipment() {
    setFeedback(null);
    setActiveAction("generate");
    startTransition(async () => {
      try {
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
          router.refresh();
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
      } finally {
        setActiveAction(null);
      }
    });
  }

  function retryMockGeneration() {
    setFeedback(null);
    setActiveAction("retry-mock");
    startTransition(async () => {
      try {
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
      } finally {
        setActiveAction(null);
      }
    });
  }

  function registerManualTracking() {
    setFeedback(null);
    const normalized = trackingCode.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(normalized)) {
      setFeedback({ tone: "error", message: "Informe um codigo S10 valido, como AA123456789BR." });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(postedAt)) {
      setFeedback({ tone: "error", message: "Informe a data da postagem ou geracao manual." });
      return;
    }
    if (manualNote.trim().length < 10) {
      setFeedback({ tone: "error", message: "Informe uma observacao explicando o cadastro manual." });
      return;
    }
    setActiveAction("manual");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/vendor/orders/${orderId}/shipments/manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            labelUrl: labelUrl.trim(),
            note: manualNote.trim(),
            postedAt,
            serviceCode: serviceCode.trim(),
            trackingCode: normalized,
          }),
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
      } finally {
        setActiveAction(null);
      }
    });
  }

  if (!showDisclaimer && !next && !canCancel && !canGenerateShipment && !canRegisterManual) {
    return null;
  }

  return (
    <div className="mt-5 border-t border-brand-dark/10 pt-5">
      <div className="space-y-4">
        {showDisclaimer ? (
          <ShipmentDisclaimer
            generationStatus={generationStatus}
            manualFallbackOpen={manualFallbackOpen}
            supportReviewRequired={supportReviewRequired}
          />
        ) : null}
        {feedback ? (
          <p
            className={`rounded-[10px] border px-4 py-3 text-sm font-semibold ${
              feedback.tone === "success"
                ? "border-[#97b38e] bg-[#e4efe0] text-[#28422d]"
                : "border-[#c0392b] bg-[#c0392b]/10 text-[#c0392b]"
            }`}
            role="alert"
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {next ? (
          <button
            className="cursor-pointer rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-yellow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy}
            onClick={() => update(next)}
            type="button"
          >
            {activeAction === "status" ? nextStatusPending[status] ?? "Atualizando..." : nextStatusLabel[status]}
          </button>
        ) : null}
        {canGenerateShipment ? (
          <button
            className="cursor-pointer rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-yellow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy}
            onClick={generateShipment}
            type="button"
          >
            {activeAction === "generate" ? "Gerando etiqueta..." : "Gerar etiqueta dos Correios"}
          </button>
        ) : null}
        {canCancel ? (
          <button
            className="cursor-pointer rounded-full border border-[#c0392b] bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#c0392b] transition hover:bg-[#c0392b]/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy}
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
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-brand-dark/60">
              Codigo de rastreamento
              <input
                aria-describedby="manual-tracking-title"
                className="mt-2 w-full rounded-xl border border-brand-dark/20 bg-white px-4 py-3 font-mono text-sm uppercase tracking-[0.08em] outline-none transition focus:border-brand-dark"
                disabled={isBusy}
                maxLength={13}
                onChange={(event) => setTrackingCode(event.target.value)}
                placeholder="AA123456789BR"
                type="text"
                value={trackingCode}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-widest text-brand-dark/60">
              Servico usado
              <input
                className="mt-2 w-full rounded-xl border border-brand-dark/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-dark"
                disabled={isBusy}
                onChange={(event) => setServiceCode(event.target.value)}
                placeholder="PAC, SEDEX ou codigo"
                type="text"
                value={serviceCode}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-widest text-brand-dark/60">
              Data da postagem
              <input
                className="mt-2 w-full rounded-xl border border-brand-dark/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-dark"
                disabled={isBusy}
                onChange={(event) => setPostedAt(event.target.value)}
                type="date"
                value={postedAt}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-widest text-brand-dark/60">
              URL da etiqueta
              <input
                className="mt-2 w-full rounded-xl border border-brand-dark/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-dark"
                disabled={isBusy}
                onChange={(event) => setLabelUrl(event.target.value)}
                placeholder="Opcional"
                type="url"
                value={labelUrl}
              />
            </label>
          </div>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-widest text-brand-dark/60">
            Observacao
            <textarea
              className="mt-2 min-h-24 w-full rounded-xl border border-brand-dark/20 bg-white px-4 py-3 text-sm normal-case tracking-normal outline-none transition focus:border-brand-dark"
              disabled={isBusy}
              onChange={(event) => setManualNote(event.target.value)}
              placeholder="Explique por que o cadastro manual foi usado."
              value={manualNote}
            />
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              className="cursor-pointer rounded-full border border-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-dark transition hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isBusy}
              onClick={registerManualTracking}
              type="button"
            >
              {activeAction === "manual" ? "Salvando..." : "Cadastrar rastreamento"}
            </button>
            {canRetryMock ? (
              <button
                className="cursor-pointer text-sm font-semibold text-brand-dark underline decoration-brand-dark/30 underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isBusy}
                onClick={retryMockGeneration}
                type="button"
              >
                Tentar geracao simulada novamente
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <VendorCancelShipmentModal
        errorMessage={cancelError}
        isSubmitting={isBusy}
        onClose={() => setIsModalOpen(false)}
        onConfirm={(reason) => update("cancelado", reason)}
        open={isModalOpen}
      />
    </div>
  );
}
