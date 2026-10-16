"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { useCartStockValidation, useCartStore } from "@/features/cart";
import { placeOrder, useCheckoutStore } from "@/features/checkout";
import type { PlaceOrderError, PlaceOrderInput } from "@/features/checkout/types/checkout";
import { CHECKOUT_STEP_ROUTES } from "@/features/checkout/utils/checkout-step-access";
import { redirectToCheckoutPro } from "@/features/checkout/utils/redirect-to-checkout-pro";
import { resolveCheckoutOutcome, type CheckoutOutcome } from "@/features/checkout/utils/resolve-checkout-outcome";

const SHIPPING_STALE_CODE = "papelito_checkout_shipping_stale";
const RECONCILING_CODE = "papelito_payment_attempt_reconciling";
const STOCK_CHANGED_MESSAGE =
  "O estoque de um ou mais itens mudou. Volte ao carrinho para revisar os produtos e recalcular o frete.";
const ROTATING_ERROR_CODES = new Set([
  "papelito_checkout_attempt_payload_conflict",
  "papelito_checkout_company_context_changed",
]);

type ReviewOrderSubmissionInput = {
  /** Monta o place-order com o id de tentativa sincronizado; `null` quando falta frete válido. */
  buildOrder: (checkoutAttemptId: string) => PlaceOrderInput | null;
  /** Fingerprint do checkout: o mesmo payload reaproveita o mesmo `checkoutAttemptId`. */
  fingerprint: string;
  /** Preço com erro ou pendente de confirmação: nada é enviado. */
  blocked: boolean;
};

/**
 * Envio do pedido da revisão com trava de duplo clique, validação de estoque e o desfecho do
 * backend: redirect ao Checkout Pro, coleta Pagar.me guardada no store, reconciliação levando
 * ao pedido, PIX/boleto pendentes e cartão aprovado. Devolve erro, estado de envio e `submitOrder`.
 */
export function useReviewOrderSubmission({ buildOrder, fingerprint, blocked }: ReviewOrderSubmissionInput) {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const rotateCheckoutAttempt = useCheckoutStore((state) => state.rotateCheckoutAttempt);
  const syncCheckoutAttempt = useCheckoutStore((state) => state.syncCheckoutAttempt);
  const clearShippingQuote = useCheckoutStore((state) => state.clearShippingQuote);
  const setRequiresShippingReselection = useCheckoutStore((state) => state.setRequiresShippingReselection);
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);
  const setPendingPaymentAttempt = useCheckoutStore((state) => state.setPendingPaymentAttempt);
  const stockValidation = useCartStockValidation();
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const submissionRef = useRef(false);
  const isProcessing = isSubmitting || pending || stockValidation.isValidating;

  function releaseSubmission(message: string) {
    setCheckoutError(message);
    setIsSubmitting(false);
    submissionRef.current = false;
  }

  function leaveCheckout() {
    clearCart();
    resetCheckout();
    submissionRef.current = false;
  }

  function handleError(error: PlaceOrderError) {
    if (error.code === SHIPPING_STALE_CODE) {
      clearShippingQuote();
      setRequiresShippingReselection(true);
      releaseSubmission("");
      router.push(CHECKOUT_STEP_ROUTES[1]);
      return;
    }

    if (error.code === RECONCILING_CODE && error.orderId) {
      leaveCheckout();
      router.push(`/checkout/pagamento/${error.orderId}`);
      return;
    }

    releaseSubmission(error.message);
    if (ROTATING_ERROR_CODES.has(error.code)) {
      rotateCheckoutAttempt();
    }
  }

  function applyOutcome(outcome: CheckoutOutcome) {
    if (outcome.kind === "error") {
      releaseSubmission(outcome.message);
      rotateCheckoutAttempt();
      return;
    }

    leaveCheckout();

    if (outcome.kind === "redirect") {
      submissionRef.current = true;
      redirectToCheckoutPro(outcome.redirectUrl);
      return;
    }

    if (outcome.kind === "requires_payment_input") {
      setPendingPaymentAttempt({
        orderId: Number(outcome.orderId),
        paymentAttemptId: outcome.paymentAttemptId,
        configurationVersion: outcome.configurationVersion,
      });
    }

    const route = outcome.kind === "confirmed" ? "sucesso" : "pagamento";
    router.push(`/checkout/${route}/${outcome.orderId}`);
  }

  async function sendOrder() {
    const input = buildOrder(syncCheckoutAttempt(fingerprint));

    if (!input) {
      releaseSubmission("Selecione uma opção de frete válida antes de finalizar.");
      return;
    }

    const result = await placeOrder(input);

    if (result.ok) {
      applyOutcome(resolveCheckoutOutcome(result.result));
    } else {
      handleError(result.error);
    }
  }

  async function submitOrder() {
    if (isProcessing || submissionRef.current || blocked) {
      return;
    }

    submissionRef.current = true;
    setCheckoutError("");
    setIsSubmitting(true);

    const stockOutcome = await stockValidation.validateStock();
    if (stockOutcome.status !== "valid") {
      releaseSubmission(STOCK_CHANGED_MESSAGE);
      return;
    }

    startTransition(async () => {
      try {
        await sendOrder();
      } catch {
        releaseSubmission("Não foi possível concluir o pedido.");
      }
    });
  }

  return { checkoutError, isProcessing, submitOrder };
}
