"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { useCheckoutPaymentForm, useCheckoutStore } from "@/features/checkout";
import { continuePaymentAttempt } from "@/features/checkout/services/continue-payment-attempt";
import type { ContinuePaymentResponse, PendingPaymentAttempt, PlaceOrderError } from "@/features/checkout/types/checkout";
import { buildPagarmePayment } from "@/features/checkout/utils/build-pagarme-payment";
import { paymentConstraints } from "@/features/checkout/utils/payment-constraints";
import { resolveCheckoutOutcome } from "@/features/checkout/utils/resolve-checkout-outcome";
import type { ProfileOrderDetail } from "@/features/orders/types/profile-order-detail";
import { useAuthSession } from "@/hooks/use-auth-session";

import { CheckoutNotice } from "./checkout-notice";
import { CheckoutPrimaryButton } from "./checkout-primary-button";
import { CheckoutStatusHeader } from "./checkout-status-header";
import { OrderPaymentSummary } from "./order-payment-summary";
import { PagarmePaymentFields } from "./pagarme-payment-fields";
import { PagarmePaymentNotices } from "./pagarme-payment-notices";
import { PaymentSectionTitle } from "./payment-method-panel";

const STALE_CODE = "papelito_payment_configuration_stale";
const RECONCILING_CODE = "papelito_payment_attempt_reconciling";
const CLOSED_CODES = new Set(["papelito_payment_attempt_closed", "papelito_payment_attempt_not_found"]);
const RETRY_MESSAGE = "Não foi possível concluir o pagamento. Tente de novo.";

const REVISE_MESSAGE =
  "As condições de pagamento mudaram. Nada foi cobrado: revise os dados e confirme o pagamento de novo.";

type ContinuationAction =
  | { kind: "success" }
  | { kind: "refresh" }
  | { kind: "retry"; message: string }
  | { kind: "revise"; message: string; configurationVersion: string }
  | { kind: "stale"; message: string }
  | { kind: "closed"; message: string };

type Feedback = { kind: "idle" } | { kind: "retry" | "revise" | "stale" | "closed"; message: string };

const IDLE: Feedback = { kind: "idle" };

function errorAction(error: PlaceOrderError): ContinuationAction {
  if (error.code === STALE_CODE && error.configurationVersion !== undefined) {
    return { kind: "revise", message: REVISE_MESSAGE, configurationVersion: error.configurationVersion };
  }
  if (error.code === STALE_CODE) return { kind: "stale", message: error.message };
  if (CLOSED_CODES.has(error.code)) return { kind: "closed", message: error.message };
  if (error.code === RECONCILING_CODE) return { kind: "refresh" };

  return { kind: "retry", message: error.message || RETRY_MESSAGE };
}

function continuationAction(response: ContinuePaymentResponse): ContinuationAction {
  if (!response.ok) return errorAction(response.error);

  const outcome = resolveCheckoutOutcome(response.result);

  if (outcome.kind === "confirmed") return { kind: "success" };
  if (outcome.kind === "error") return { kind: "closed", message: outcome.message };
  if (outcome.kind === "requires_payment_input") return { kind: "retry", message: RETRY_MESSAGE };

  return { kind: "refresh" };
}

type FeedbackPanelProps = {
  feedback: Feedback;
  onRefresh: () => void;
  onLeave: () => void;
};

function FeedbackPanel({ feedback, onRefresh, onLeave }: Readonly<FeedbackPanelProps>) {
  if (feedback.kind === "revise") {
    return <CheckoutNotice tone="warning">{feedback.message}</CheckoutNotice>;
  }

  if (feedback.kind === "stale") {
    return (
      <div>
        <CheckoutNotice tone="warning">{feedback.message}</CheckoutNotice>
        <CheckoutPrimaryButton onClick={onRefresh}>Atualizar página</CheckoutPrimaryButton>
      </div>
    );
  }

  if (feedback.kind === "closed") {
    return (
      <div>
        <CheckoutNotice tone="error">{feedback.message}</CheckoutNotice>
        <Link
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand-yellow px-6 text-sm font-black uppercase tracking-[0.14em] text-brand-dark transition hover:brightness-95"
          href="/produtos"
          onClick={onLeave}
        >
          Voltar a comprar
        </Link>
      </div>
    );
  }

  return null;
}

type CheckoutPaymentContinuationProps = {
  order: ProfileOrderDetail;
  attempt: PendingPaymentAttempt;
};

/**
 * Coleta Pagar.me de um pedido já reservado cujo Mercado Pago falhou antes de cobrar. Envia
 * método e token novos para a MESMA tentativa (`/continue`), nunca um novo place-order; o token
 * é descartado a cada falha. Configuração obsoleta com versão nova pede nova confirmação (o envio
 * seguinte usa essa versão, nunca automático); sem gateway apto o pedido é encerrado.
 */
export function CheckoutPaymentContinuation({ order, attempt }: Readonly<CheckoutPaymentContinuationProps>) {
  const router = useRouter();
  const { b2b } = useAuthSession();
  const paymentForm = useCheckoutPaymentForm();
  const patchPaymentForm = useCheckoutStore((state) => state.patchPaymentForm);
  const clearPendingPaymentAttempt = useCheckoutStore((state) => state.clearPendingPaymentAttempt);
  const storedAttempt = useCheckoutStore((state) => state.pendingPaymentAttempt);
  const setPendingPaymentAttempt = useCheckoutStore((state) => state.setPendingPaymentAttempt);
  const [configurationVersion, setConfigurationVersion] = useState(attempt.configurationVersion);
  const [feedback, setFeedback] = useState<Feedback>(IDLE);
  const [pending, startTransition] = useTransition();
  const submittingRef = useRef(false);
  const constraints = paymentConstraints({
    method: paymentForm.method,
    installments: paymentForm.form.installments,
    totalCents: Math.round(order.total * 100),
  });
  const blocked = feedback.kind === "stale" || feedback.kind === "closed";
  const disabled = pending || !paymentForm.canContinue || !constraints.amountAllowed || !constraints.installmentAllowed;

  function applyAction(action: ContinuationAction) {
    if (action.kind === "success") {
      clearPendingPaymentAttempt();
      router.replace(`/checkout/sucesso/${order.id}`);
      return;
    }

    if (action.kind === "refresh") {
      clearPendingPaymentAttempt();
      router.refresh();
      return;
    }

    patchPaymentForm({ cardTokenId: "", cardLast4: "" });
    submittingRef.current = false;

    if (action.kind === "revise") {
      adoptConfigurationVersion(action.configurationVersion);
      setFeedback({ kind: "revise", message: action.message });
      return;
    }

    setFeedback(action);
  }

  function adoptConfigurationVersion(version: string) {
    setConfigurationVersion(version);

    if (storedAttempt?.paymentAttemptId === attempt.paymentAttemptId) {
      setPendingPaymentAttempt({ ...storedAttempt, configurationVersion: version });
    }
  }

  async function sendPayment() {
    await paymentForm.prepareCardToken();

    const { paymentMethod, paymentForm: form, useDeliveryAddressForBilling, billingAddressForm } = useCheckoutStore.getState();
    const response = await continuePaymentAttempt({
      paymentAttemptId: attempt.paymentAttemptId,
      expectedCompanyId: typeof b2b?.companyId === "number" ? b2b.companyId : undefined,
      configurationVersion,
      payment: buildPagarmePayment({
        method: paymentMethod,
        form,
        billingAddress: useDeliveryAddressForBilling ? undefined : billingAddressForm,
      }),
    });

    applyAction(continuationAction(response));
  }

  function submit() {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setFeedback(IDLE);

    startTransition(async () => {
      try {
        await sendPayment();
      } catch (error) {
        applyAction({ kind: "retry", message: error instanceof Error ? error.message : RETRY_MESSAGE });
      }
    });
  }

  return (
    <main className="bg-bg-light">
      <CheckoutStatusHeader
        description="Seu pedido está reservado. Escolha como pagar para concluir."
        supraLabel="Pagamento pendente"
        title={`Pedido ${order.orderNumber}`}
      />

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-8 md:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,368px)]">
          <form className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] md:p-8">
            <PaymentSectionTitle>Como pagar</PaymentSectionTitle>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              O Mercado Pago não está disponível para este pedido agora. Escolha outra forma de pagar
              este mesmo pedido — nada foi cobrado até aqui.
            </p>

            <PagarmePaymentFields maxInstallments={constraints.maxInstallments} paymentForm={paymentForm} />
            <PagarmePaymentNotices
              constraints={constraints}
              paymentError={feedback.kind === "retry" ? feedback.message : ""}
              paymentForm={paymentForm}
              pending={pending}
            />
            <FeedbackPanel feedback={feedback} onLeave={clearPendingPaymentAttempt} onRefresh={() => router.refresh()} />

            {blocked ? null : (
              <CheckoutPrimaryButton disabled={disabled} onClick={submit}>
                {pending ? "Processando pagamento..." : "Pagar pedido"}
              </CheckoutPrimaryButton>
            )}
          </form>

          <OrderPaymentSummary order={order} />
        </div>
      </section>
    </main>
  );
}
