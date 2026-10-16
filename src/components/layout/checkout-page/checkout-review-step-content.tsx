"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import { getCartLineTotal, useCartStore } from "@/features/cart";
import { isAddressFormComplete, useCheckoutStore } from "@/features/checkout";
import { usePaymentContext, type PaymentContextView } from "@/features/checkout/hooks/use-payment-context";
import type {
  CheckoutAddressForm,
  PaymentForm,
  PaymentMethod,
  PlaceOrderInput,
  ShippingQuoteOption,
} from "@/features/checkout/types/checkout";
import { buildPagarmePayment } from "@/features/checkout/utils/build-pagarme-payment";
import { buildPlaceOrderItems } from "@/features/checkout/utils/build-place-order-items";
import { resolveSelectedShipping } from "@/features/checkout/utils/resolve-selected-shipping";
import { formatBusinessDays } from "@/features/shipping/utils/format-business-days";
import { shippingProviderLabel } from "@/features/shipping/utils/shipping-provider-label";
import { readGaIdentifiers } from "@/lib/analytics/ga-cookies";
import { formatBRL } from "@/lib/format-currency";
import { useAuthSession } from "@/hooks/use-auth-session";
import { CheckoutEmptyCart } from "./checkout-empty-cart";
import { CheckoutHeader } from "./checkout-header";
import { CheckoutNotice } from "./checkout-notice";
import { CheckoutOrderSummary } from "./checkout-order-summary";
import { CheckoutPrimaryButton } from "./checkout-primary-button";
import { useReviewOrderSubmission } from "./use-review-order-submission";

function getPaymentLabel(method: "credit_card" | "pix" | "boleto") {
  if (method === "credit_card") return "Cartão de crédito";
  if (method === "pix") return "Pix";
  return "Boleto bancário";
}

function isMercadoPagoView(view: PaymentContextView) {
  return view.status === "ready" && view.context.provider === "mercadopago";
}

function submitLabel(view: PaymentContextView) {
  if (view.status === "loading") return "Carregando formas de pagamento";
  if (isMercadoPagoView(view)) return "Continuar para o Mercado Pago";

  return "Finalizar pedido";
}

type ReviewPaymentDetailsProps = {
  view: PaymentContextView;
  paymentMethod: PaymentMethod;
  paymentForm: PaymentForm;
};

function ReviewPaymentDetails({ view, paymentMethod, paymentForm }: Readonly<ReviewPaymentDetailsProps>) {
  if (view.status === "loading") return <p>Carregando formas de pagamento...</p>;
  if (view.status === "error") return <p className="text-[#B42318]">{view.message}</p>;

  if (view.context.provider === "mercadopago") {
    return (
      <>
        <p className="font-medium text-brand-dark">Mercado Pago</p>
        <p>Você escolhe Pix, cartão ou boleto no Mercado Pago depois de continuar.</p>
      </>
    );
  }

  if (paymentMethod !== "credit_card") return <p>{getPaymentLabel(paymentMethod)}</p>;

  const maskedCard = paymentForm.cardLast4 ? `•••• •••• •••• ${paymentForm.cardLast4}` : "Não informado";

  return (
    <>
      <p>{getPaymentLabel(paymentMethod)}</p>
      <p>{maskedCard}</p>
      <p>{paymentForm.holderName || "Titular não informado"}</p>
      <p>{paymentForm.installments || "Parcelamento não informado"}</p>
    </>
  );
}

function ReviewPaymentSection(props: Readonly<ReviewPaymentDetailsProps>) {
  return (
    <section className="mt-4 rounded-[14px] border border-[#E5E7EB] bg-[#FCFCFD] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
          Forma de pagamento
        </h3>
        <Link
          className="text-xs font-medium text-text-tertiary transition hover:text-brand-dark"
          href="/checkout/pagamento"
        >
          Editar
        </Link>
      </div>

      <div className="mt-3 space-y-1 text-sm tracking-[-0.1504px] text-text-secondary">
        <ReviewPaymentDetails {...props} />
      </div>
    </section>
  );
}

type ReviewAddressSectionProps = {
  addressForm: CheckoutAddressForm;
};

function ReviewAddressSection({ addressForm }: Readonly<ReviewAddressSectionProps>) {
  return (
    <section className="mt-6 rounded-[14px] border border-[#E5E7EB] bg-[#FCFCFD] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
          Endereço de entrega
        </h3>
        <Link
          className="text-xs font-medium text-text-tertiary transition hover:text-brand-dark"
          href="/checkout"
        >
          Editar
        </Link>
      </div>

      <div className="mt-3 space-y-1 text-sm tracking-[-0.1504px] text-text-secondary">
        <p>
          {addressForm.street || "Rua não informada"},{" "}
          {addressForm.number || "s/n"}
        </p>
        {addressForm.complement ? <p>{addressForm.complement}</p> : null}
        <p>
          {addressForm.neighborhood || "Bairro não informado"} -{" "}
          {addressForm.city || "Cidade não informada"} /{" "}
          {addressForm.state || "--"}
        </p>
        <p>CEP: {addressForm.zipCode || "Não informado"}</p>
      </div>
    </section>
  );
}

type ReviewItemsSectionProps = {
  lines: Array<{ id: string; name: string; quantity: number; total: string }>;
};

function ReviewItemsSection({ lines }: Readonly<ReviewItemsSectionProps>) {
  return (
    <section className="mt-4 rounded-[14px] border border-[#E5E7EB] bg-[#FCFCFD] p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
        Itens
      </h3>

      <ul className="mt-3 space-y-2">
        {lines.map((line) => (
          <li className="flex items-center justify-between gap-3" key={line.id}>
            <span className="truncate text-sm tracking-[-0.1504px] text-text-secondary">
              {line.name} x{line.quantity}
            </span>
            <span className="shrink-0 text-sm font-medium text-brand-dark">
              {line.total}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type ReviewShippingSectionProps = {
  option: ShippingQuoteOption | null;
};

function ReviewShippingSection({ option }: Readonly<ReviewShippingSectionProps>) {
  return (
    <section className="mt-4 rounded-[14px] border border-[#E5E7EB] bg-[#FCFCFD] p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
        Frete
      </h3>

      {option ? (
        <div className="mt-3 space-y-1 text-sm tracking-[-0.1504px] text-text-secondary">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-tertiary">
            {shippingProviderLabel(option.provider)}
          </p>
          <p className="font-medium text-brand-dark">{option.service}</p>
          <p>{formatBRL(option.price)}</p>
          <p>{option.deliveryTime ? formatBusinessDays(option.deliveryTime) : "Prazo sob consulta"}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm tracking-[-0.1504px] text-[#B42318]">
          Selecione uma opção de frete válida antes de finalizar.
        </p>
      )}
    </section>
  );
}

function isCardFormReady(form: PaymentForm) {
  return form.holderName.trim().length >= 3 && Boolean(form.installments) && Boolean(form.cardTokenId);
}

function shippingOptionKey(option: ShippingQuoteOption) {
  return option.optionKey ?? `correios:${option.code}`;
}

type ReviewOrderInputParams = {
  checkoutAttemptId: string;
  expectedCompanyId?: number;
  items: PlaceOrderInput["items"];
  address: CheckoutAddressForm;
  option: ShippingQuoteOption | null;
  payment?: PlaceOrderInput["payment"];
  couponCode: string | null;
};

function buildReviewOrderInput(params: ReviewOrderInputParams): PlaceOrderInput | null {
  const { option, address } = params;

  if (!option) return null;

  return {
    analytics: readGaIdentifiers(),
    checkoutAttemptId: params.checkoutAttemptId,
    expectedCompanyId: params.expectedCompanyId,
    items: params.items,
    address,
    shipping: {
      selectedOptionKey: shippingOptionKey(option),
      expectedFingerprint: option.fingerprint,
      expectedCustomerPriceCents: option.customerPriceCents,
      expectedDeliveryTime: option.deliveryTime,
      expectedExpiresAt: option.expiresAt,
      destinationCep: address.zipCode.replace(/\D/g, ""),
    },
    payment: params.payment,
    couponCode: params.couponCode,
  };
}

/**
 * Revisão e envio do pedido. O gateway vem do PaymentContext: no Mercado Pago o place-order
 * vai sem pagamento e o comprador segue ao Checkout Pro; se o backend pedir a coleta Pagar.me,
 * a tentativa fica no store e a coleta acontece na página do pedido, sem novo place-order.
 */
export function CheckoutReviewStepContent() {
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.coupon?.code ?? null);
  const pricingError = useCartStore((state) => state.pricingError);
  const pricing = useCartStore((state) => state.pricing);
  const pricingRequiresConfirmation = useCartStore((state) => state.pricingRequiresConfirmation);
  const addressForm = useCheckoutStore((state) => state.addressForm);
  const billingAddressForm = useCheckoutStore((state) => state.billingAddressForm);
  const useDeliveryAddressForBilling = useCheckoutStore((state) => state.useDeliveryAddressForBilling);
  const paymentMethod = useCheckoutStore((state) => state.paymentMethod);
  const paymentForm = useCheckoutStore((state) => state.paymentForm);
  const shippingQuote = useCheckoutStore((state) => state.shippingQuote);
  const syncCheckoutAttempt = useCheckoutStore((state) => state.syncCheckoutAttempt);
  const { b2b } = useAuthSession();
  const placeOrderItems = useMemo(() => buildPlaceOrderItems(items), [items]);
  const { view: paymentContext } = usePaymentContext(placeOrderItems);
  const usesMercadoPago = isMercadoPagoView(paymentContext);
  const usesPagarmeCard = !usesMercadoPago && paymentMethod === "credit_card";
  const activeBillingAddress = useDeliveryAddressForBilling ? addressForm : billingAddressForm;
  const cardReady = !usesPagarmeCard || (isCardFormReady(paymentForm) && isAddressFormComplete(activeBillingAddress));
  const canFinishOrder = isAddressFormComplete(addressForm) && cardReady;
  const selectedShippingQuote = resolveSelectedShipping(shippingQuote, addressForm.zipCode);
  const hasInvalidCartItems = placeOrderItems.length !== items.length;
  const pricingBlocked = Boolean(pricingError) || pricingRequiresConfirmation;
  const companyId = typeof b2b?.companyId === "number" ? b2b.companyId : undefined;
  const canSubmitOrder =
    canFinishOrder &&
    Boolean(selectedShippingQuote) &&
    !hasInvalidCartItems &&
    !pricingBlocked &&
    paymentContext.status === "ready" &&
    b2b?.canPurchase === true &&
    companyId !== undefined;
  const pagarmePayment = buildPagarmePayment({ method: paymentMethod, form: paymentForm, billingAddress: activeBillingAddress });

  const checkoutAttemptFingerprint = JSON.stringify({
    expectedCompanyId: companyId ?? null,
    items: placeOrderItems,
    address: addressForm,
    shipping: {
      selectedOptionKey: selectedShippingQuote ? shippingOptionKey(selectedShippingQuote) : null,
      destinationCep: addressForm.zipCode.replace(/\D/g, ""),
    },
    payment: usesMercadoPago ? { provider: "mercadopago" } : pagarmePayment,
    couponCode,
  });

  const { checkoutError, isProcessing, submitOrder } = useReviewOrderSubmission({
    fingerprint: checkoutAttemptFingerprint,
    blocked: pricingBlocked || !selectedShippingQuote,
    buildOrder: (checkoutAttemptId) =>
      buildReviewOrderInput({
        checkoutAttemptId,
        expectedCompanyId: companyId,
        items: placeOrderItems,
        address: addressForm,
        option: selectedShippingQuote,
        payment: usesMercadoPago ? undefined : pagarmePayment,
        couponCode,
      }),
  });

  useEffect(() => {
    syncCheckoutAttempt(checkoutAttemptFingerprint);
  }, [checkoutAttemptFingerprint, syncCheckoutAttempt]);

  if (items.length === 0 && !isProcessing) return <CheckoutEmptyCart />;

  const cartLines = items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    total: formatBRL(getCartLineTotal(item, pricing)),
  }));

  return (
    <main className="bg-bg-light">
      <CheckoutHeader
        backHref="/checkout/pagamento"
        backLabel="Voltar para pagamento"
        currentStep={3}
      />

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,299px)]">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <h2 className="text-[20px] font-black uppercase tracking-[-0.4492px] text-brand-dark">
              Revisão do pedido
            </h2>

            {isProcessing ? (
              <LogoSpinnerLoader
                className="min-h-80"
                label="Processando pagamento"
                message="Aguarde enquanto preparamos a próxima etapa..."
              />
            ) : (
              <>
                <ReviewAddressSection addressForm={addressForm} />

                <ReviewPaymentSection
                  paymentForm={paymentForm}
                  paymentMethod={paymentMethod}
                  view={paymentContext}
                />

                <ReviewItemsSection lines={cartLines} />
                <ReviewShippingSection option={selectedShippingQuote} />

                <CheckoutNotice show={!canFinishOrder} tone="warning">
                  Complete os dados de endereço e pagamento para finalizar o pedido.
                </CheckoutNotice>
                <CheckoutNotice show={canFinishOrder && !selectedShippingQuote} tone="warning">
                  Revise a cotação de frete antes de concluir o pedido.
                </CheckoutNotice>
                <CheckoutNotice show={hasInvalidCartItems} tone="warning">
                  Seu carrinho contém um item inválido para fechamento do pedido.
                </CheckoutNotice>
                <CheckoutNotice show={Boolean(pricingError)} tone="error">
                  {pricingError}
                </CheckoutNotice>
                <CheckoutNotice show={pricingRequiresConfirmation} tone="warning">
                  Confirme os preços recalculados no resumo antes de finalizar.
                </CheckoutNotice>
                <CheckoutNotice show={b2b?.canPurchase !== true} tone="warning">
                  Sua empresa não está apta para finalizar a compra. Revise o cadastro empresarial.
                </CheckoutNotice>
                <CheckoutNotice show={Boolean(checkoutError)} tone="error">
                  {checkoutError}
                </CheckoutNotice>

                <CheckoutPrimaryButton disabled={!canSubmitOrder} onClick={() => void submitOrder()}>
                  {submitLabel(paymentContext)}
                </CheckoutPrimaryButton>
              </>
            )}
          </div>

          <CheckoutOrderSummary />
        </div>
      </section>
    </main>
  );
}
