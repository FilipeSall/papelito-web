"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useCartStore } from "@/features/cart";
import { useCheckoutStore } from "@/features/checkout";
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
  const items = useCartStore((state) => state.items);
  const addressForm = useCheckoutStore((state) => state.addressForm);
  const paymentMethod = useCheckoutStore((state) => state.paymentMethod);
  const paymentForm = useCheckoutStore((state) => state.paymentForm);

  if (items.length === 0) return <CheckoutEmptyCart />;

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
        paymentForm.cardNumber.replace(/\D/g, "").length >= 13 &&
        paymentForm.expiryDate.replace(/\D/g, "").length === 4 &&
        paymentForm.cvv.replace(/\D/g, "").length >= 3 &&
        Boolean(paymentForm.installments)
      : true;

  const canFinishOrder = isAddressValid && isPaymentValid;

  const cartLines = items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    total: formatBRL(item.quantity * item.price),
  }));

  const maskedCard = paymentForm.cardNumber
    ? `•••• •••• •••• ${paymentForm.cardNumber.replace(/\D/g, "").slice(-4)}`
    : "Nao informado";

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
                  {addressForm.street || "Rua nao informada"}, {addressForm.number || "s/n"}
                </p>
                {addressForm.complement ? <p>{addressForm.complement}</p> : null}
                <p>
                  {addressForm.neighborhood || "Bairro nao informado"} -{" "}
                  {addressForm.city || "Cidade nao informada"} / {addressForm.state || "--"}
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
                    <p>{paymentForm.holderName || "Titular nao informado"}</p>
                    <p>{paymentForm.installments || "Parcelamento nao informado"}</p>
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

            {!canFinishOrder ? (
              <p className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                Complete os dados de endereco e pagamento para finalizar o pedido.
              </p>
            ) : null}

            <button
              type="button"
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canFinishOrder}
            >
              Finalizar pedido
              <ArrowRightIcon className="h-4.5 w-4.5" size={18} strokeWidth={1.8} />
            </button>
          </div>

          <CheckoutOrderSummary />
        </div>
      </section>
    </main>
  );
}
