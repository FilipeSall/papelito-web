"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useCartStore } from "@/features/cart";
import { useCheckoutPaymentForm } from "@/features/checkout";
import { usePaymentContext, type PaymentContextView } from "@/features/checkout/hooks/use-payment-context";
import { buildPlaceOrderItems } from "@/features/checkout/utils/build-place-order-items";
import { paymentConstraints } from "@/features/checkout/utils/payment-constraints";
import { CheckoutEmptyCart } from "./checkout-empty-cart";
import { CheckoutHeader } from "./checkout-header";
import { CheckoutOrderSummary } from "./checkout-order-summary";
import { CheckoutPrimaryButton } from "./checkout-primary-button";
import { PagarmePaymentFields } from "./pagarme-payment-fields";
import { PagarmePaymentNotices } from "./pagarme-payment-notices";
import { MercadoPagoPaymentInfo, PaymentContextError, PaymentContextLoading } from "./payment-context-states";

const REVIEW_ROUTE = "/checkout/revisao";

function usePricingBlocked() {
  const pricingError = useCartStore((state) => state.pricingError);
  const pricingRequiresConfirmation = useCartStore((state) => state.pricingRequiresConfirmation);

  return Boolean(pricingError) || pricingRequiresConfirmation;
}

function PagarmePaymentStep() {
  const router = useRouter();
  const pricing = useCartStore((state) => state.pricing);
  const pricingBlocked = usePricingBlocked();
  const [paymentError, setPaymentError] = useState("");
  const [pending, startTransition] = useTransition();
  const paymentForm = useCheckoutPaymentForm();
  const constraints = paymentConstraints({
    method: paymentForm.method,
    installments: paymentForm.form.installments,
    totalCents: pricing ? pricing.totals.totalCents : null,
    restrictions: pricing?.paymentRestrictions,
  });
  const disabled =
    !paymentForm.canContinue || pending || !constraints.amountAllowed || !constraints.installmentAllowed || pricingBlocked;

  function goToReview() {
    setPaymentError("");

    startTransition(async () => {
      try {
        await paymentForm.prepareCardToken();
        router.push(REVIEW_ROUTE);
      } catch (error) {
        setPaymentError(error instanceof Error ? error.message : "Não foi possível preparar o pagamento.");
      }
    });
  }

  return (
    <>
      <PagarmePaymentFields maxInstallments={constraints.maxInstallments} paymentForm={paymentForm} />
      <PagarmePaymentNotices constraints={constraints} paymentError={paymentError} paymentForm={paymentForm} pending={pending} />
      <CheckoutPrimaryButton disabled={disabled} onClick={goToReview}>
        {pending ? "Preparando pagamento..." : "Próximo: Revisão"}
      </CheckoutPrimaryButton>
    </>
  );
}

function MercadoPagoPaymentStep() {
  const router = useRouter();
  const pricingBlocked = usePricingBlocked();

  return (
    <>
      <MercadoPagoPaymentInfo />
      <CheckoutPrimaryButton disabled={pricingBlocked} onClick={() => router.push(REVIEW_ROUTE)}>
        Próximo: Revisão
      </CheckoutPrimaryButton>
    </>
  );
}

type PaymentStepBodyProps = {
  view: PaymentContextView;
  onRetry: () => void;
};

function PaymentStepBody({ view, onRetry }: Readonly<PaymentStepBodyProps>) {
  if (view.status === "loading") return <PaymentContextLoading />;
  if (view.status === "error") return <PaymentContextError message={view.message} onRetry={onRetry} />;
  if (view.context.provider === "mercadopago") return <MercadoPagoPaymentStep />;

  return <PagarmePaymentStep />;
}

/**
 * Etapa de pagamento. Antes de oferecer qualquer meio, lê o PaymentContext: no Mercado Pago
 * não há seleção nem tokenização (o método é escolhido no Checkout Pro); na Pagar.me segue o
 * formulário de sempre. Erro de contexto bloqueia a etapa com a mensagem do catálogo.
 */
export function CheckoutPaymentStepContent() {
  const items = useCartStore((state) => state.items);
  const placeOrderItems = useMemo(() => buildPlaceOrderItems(items), [items]);
  const { view, retry } = usePaymentContext(placeOrderItems);

  if (items.length === 0) return <CheckoutEmptyCart />;

  return (
    <main className="bg-bg-light">
      <CheckoutHeader backHref="/checkout" backLabel="Voltar para endereço" currentStep={2} />

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,299px)]">
          <form className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <h2 className="text-[36px] font-black uppercase tracking-[-0.4492px] text-brand-dark">
              Forma de pagamento
            </h2>

            <PaymentStepBody view={view} onRetry={retry} />
          </form>

          <CheckoutOrderSummary />
        </div>
      </section>
    </main>
  );
}
