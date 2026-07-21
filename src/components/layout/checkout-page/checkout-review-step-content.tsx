"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import {
  getCartLineTotal,
  useCartStockValidation,
  useCartStore,
} from "@/features/cart";
import { placeOrder, useCheckoutStore } from "@/features/checkout";
import { resolveCheckoutOutcome } from "@/features/checkout/utils/resolve-checkout-outcome";
import { formatBRL } from "@/lib/format-currency";
import { CheckoutEmptyCart } from "./checkout-empty-cart";
import { CheckoutHeader } from "./checkout-header";
import { CheckoutOrderSummary } from "./checkout-order-summary";

function getPaymentLabel(method: "credit_card" | "pix" | "boleto") {
  if (method === "credit_card") return "Cartao de credito";
  if (method === "pix") return "Pix";
  return "Boleto bancario";
}

export function CheckoutReviewStepContent() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.coupon?.code ?? null);
  const clearCart = useCartStore((state) => state.clearCart);
  const pricingError = useCartStore((state) => state.pricingError);
  const pricing = useCartStore((state) => state.pricing);
  const pricingRequiresConfirmation = useCartStore(
    (state) => state.pricingRequiresConfirmation,
  );
  const addressForm = useCheckoutStore((state) => state.addressForm);
  const paymentMethod = useCheckoutStore((state) => state.paymentMethod);
  const paymentForm = useCheckoutStore((state) => state.paymentForm);
  const shippingQuote = useCheckoutStore((state) => state.shippingQuote);
  const checkoutAttemptId = useCheckoutStore((state) => state.checkoutAttemptId);
  const rotateCheckoutAttempt = useCheckoutStore((state) => state.rotateCheckoutAttempt);
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);
  const stockValidation = useCartStockValidation();
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const submissionRef = useRef(false);
  const isProcessing = isSubmitting || pending || stockValidation.isValidating;

  if (items.length === 0 && !isProcessing) return <CheckoutEmptyCart />;

  const isAddressValid =
    addressForm.zipCode.replace(/\D/g, "").length === 8 &&
    Boolean(addressForm.street.trim()) &&
    Boolean(addressForm.number.trim()) &&
    Boolean(addressForm.neighborhood.trim()) &&
    Boolean(addressForm.city.trim()) &&
    Boolean(addressForm.state.trim());

  const isPaymentValid =
    paymentMethod === "credit_card"
      ? paymentForm.holderName.trim().length >= 3 &&
        Boolean(paymentForm.installments) &&
        Boolean(paymentForm.cardTokenId)
      : true;

  const canFinishOrder = isAddressValid && isPaymentValid;
  const selectedShippingQuote = shippingQuote.selectedOption;
  const currentShippingQuote = shippingQuote.quote;
  const isShippingValid =
    Boolean(selectedShippingQuote) &&
    Boolean(currentShippingQuote) &&
    currentShippingQuote?.destinationCep ===
      addressForm.zipCode.replace(/\D/g, "");
  const placeOrderItems = items
    .map((item) => {
      const productId = Number.parseInt(item.id, 10);

      if (!Number.isInteger(productId) || productId <= 0) {
        return null;
      }

      return {
        productId,
        qty: item.quantity,
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        promotionContext: item.promotionContext,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const hasInvalidCartItems = placeOrderItems.length !== items.length;
  const canSubmitOrder =
    canFinishOrder &&
    isShippingValid &&
    !hasInvalidCartItems &&
    !pricingError &&
    !pricingRequiresConfirmation;

  const cartLines = items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    total: formatBRL(getCartLineTotal(item, pricing)),
  }));

  const maskedCard = paymentForm.cardLast4
    ? `•••• •••• •••• ${paymentForm.cardLast4}`
    : "Nao informado";

  async function submitOrder() {
    if (
      !selectedShippingQuote ||
      isProcessing ||
      submissionRef.current ||
      pricingError ||
      pricingRequiresConfirmation
    ) {
      return;
    }

    submissionRef.current = true;
    setCheckoutError("");
    setIsSubmitting(true);

    const stockOutcome = await stockValidation.validateStock();
    if (stockOutcome.status !== "valid") {
      setCheckoutError(
        "O estoque de um ou mais itens mudou. Volte ao carrinho para revisar os produtos e recalcular o frete.",
      );
      setIsSubmitting(false);
      submissionRef.current = false;
      return;
    }

    startTransition(async () => {
      try {
        const result = await placeOrder({
          checkoutAttemptId,
          items: placeOrderItems,
          address: addressForm,
          shipping: {
            selectedCode: selectedShippingQuote.code,
            destinationCep: addressForm.zipCode.replace(/\D/g, ""),
          },
          payment: {
            method: paymentMethod,
            installments:
              paymentMethod === "credit_card"
                ? Number.parseInt(paymentForm.installments, 10) || 1
                : undefined,
            cardTokenId:
              paymentMethod === "credit_card"
                ? paymentForm.cardTokenId
                : undefined,
            holderName:
              paymentMethod === "credit_card"
                ? paymentForm.holderName
                : undefined,
            billingAddress:
              paymentMethod === "credit_card" ? addressForm : undefined,
          },
          couponCode,
        });

        if (!result.ok) {
          setCheckoutError(result.error.message);
          setIsSubmitting(false);
          submissionRef.current = false;
          return;
        }

        const outcome = resolveCheckoutOutcome(result.result);

        if (outcome.kind === "error") {
          setCheckoutError(outcome.message);
          setIsSubmitting(false);
          submissionRef.current = false;
          rotateCheckoutAttempt();
          return;
        }

        if (outcome.kind === "confirmed") {
          clearCart();
          resetCheckout();
          submissionRef.current = false;
          router.push(`/checkout/sucesso/${outcome.orderId}`);
          return;
        }

        clearCart();
        resetCheckout();
        submissionRef.current = false;
        router.push(`/checkout/pagamento/${outcome.orderId}`);
      } catch {
        setCheckoutError("Nao foi possivel concluir o pedido.");
        setIsSubmitting(false);
        submissionRef.current = false;
        return;
      }
    });
  }

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
              Revisao do pedido
            </h2>

            {isProcessing ? (
              <LogoSpinnerLoader
                className="min-h-80"
                label="Processando pagamento"
                message="Aguarde enquanto preparamos a proxima etapa..."
              />
            ) : (
              <>
                <section className="mt-6 rounded-[14px] border border-[#E5E7EB] bg-[#FCFCFD] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
                      Endereco de entrega
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
                      {addressForm.street || "Rua nao informada"},{" "}
                      {addressForm.number || "s/n"}
                    </p>
                    {addressForm.complement ? (
                      <p>{addressForm.complement}</p>
                    ) : null}
                    <p>
                      {addressForm.neighborhood || "Bairro nao informado"} -{" "}
                      {addressForm.city || "Cidade nao informada"} /{" "}
                      {addressForm.state || "--"}
                    </p>
                    <p>CEP: {addressForm.zipCode || "Nao informado"}</p>
                  </div>
                </section>

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
                    <p>{getPaymentLabel(paymentMethod)}</p>
                    {paymentMethod === "credit_card" ? (
                      <>
                        <p>{maskedCard}</p>
                        <p>
                          {paymentForm.holderName || "Titular nao informado"}
                        </p>
                        <p>
                          {paymentForm.installments ||
                            "Parcelamento nao informado"}
                        </p>
                      </>
                    ) : null}
                  </div>
                </section>

                <section className="mt-4 rounded-[14px] border border-[#E5E7EB] bg-[#FCFCFD] p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
                    Itens
                  </h3>

                  <ul className="mt-3 space-y-2">
                    {cartLines.map((line) => (
                      <li
                        className="flex items-center justify-between gap-3"
                        key={line.id}
                      >
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

                <section className="mt-4 rounded-[14px] border border-[#E5E7EB] bg-[#FCFCFD] p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
                    Frete
                  </h3>

                  {selectedShippingQuote ? (
                    <div className="mt-3 space-y-1 text-sm tracking-[-0.1504px] text-text-secondary">
                      <p className="font-medium text-brand-dark">
                        {selectedShippingQuote.service}
                      </p>
                      <p>{formatBRL(selectedShippingQuote.price)}</p>
                      <p>
                        {selectedShippingQuote.deliveryTime
                          ? `${selectedShippingQuote.deliveryTime} dias uteis`
                          : "Prazo sob consulta"}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm tracking-[-0.1504px] text-[#B42318]">
                      Selecione uma opcao de frete valida antes de finalizar.
                    </p>
                  )}
                </section>

                {!canFinishOrder ? (
                  <p className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                    Complete os dados de endereco e pagamento para finalizar o
                    pedido.
                  </p>
                ) : null}

                {canFinishOrder && !isShippingValid ? (
                  <p className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                    Revise a cotacao de frete antes de concluir o pedido.
                  </p>
                ) : null}

                {hasInvalidCartItems ? (
                  <p className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                    Seu carrinho contem um item invalido para fechamento do
                    pedido.
                  </p>
                ) : null}

                {pricingError ? (
                  <p className="mt-4 rounded-[12px] border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B42318]">
                    {pricingError}
                  </p>
                ) : null}

                {pricingRequiresConfirmation ? (
                  <p className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                    Confirme os preços recalculados no resumo antes de finalizar.
                  </p>
                ) : null}

                {checkoutError ? (
                  <p className="mt-4 rounded-[12px] border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B42318]">
                    {checkoutError}
                  </p>
                ) : null}

                <button
                  type="button"
                  className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canSubmitOrder}
                  onClick={() => void submitOrder()}
                >
                  Finalizar pedido
                  <ArrowRightIcon
                    className="h-4.5 w-4.5"
                    size={18}
                    strokeWidth={1.8}
                  />
                </button>
              </>
            )}
          </div>

          <CheckoutOrderSummary />
        </div>
      </section>
    </main>
  );
}
