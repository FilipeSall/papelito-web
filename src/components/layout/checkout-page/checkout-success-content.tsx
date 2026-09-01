import Link from "next/link";

import type { ProfileOrderDetail } from "@/features/orders/types/profile-order-detail";
import { formatBRL } from "@/lib/format-currency";

import { CheckIcon, ReceiptIcon } from "./checkout-icons";
import { CheckoutStatusAside, CheckoutStatusHeader } from "./checkout-status-header";
import { OrderPaymentSummary } from "./order-payment-summary";
import { PaymentMethodPanel, PaymentPlaque, PaymentSectionTitle, PaymentSteps } from "./payment-method-panel";

function nextSteps(hasReceiptNumber: boolean) {
  return [
    "O vendedor já recebeu o pedido e vai separar os itens.",
    "Você acompanha o andamento e o código de rastreio em Meus pedidos.",
    hasReceiptNumber
      ? "O recibo já está emitido e pode ser baixado quando você quiser."
      : "O recibo do pagamento é gerado no download, a qualquer momento.",
  ];
}

/**
 * Etapa final do checkout: confirma o pagamento, diz o que acontece a seguir e
 * entrega o recibo. Usa a mesma composição da tela de pagamento pendente —
 * faixa escura, coluna de conteúdo e resumo do pedido ao lado.
 */
export function CheckoutSuccessContent({ order }: { order: ProfileOrderDetail }) {
  const receiptNumber = order.receipt.number;
  const receiptIssuedAt = order.receipt.issuedAtLabel;

  return (
    <main className="bg-bg-light">
      <CheckoutStatusHeader
        aside={<CheckoutStatusAside label="Total pago" value={formatBRL(order.total)} note={order.payment.methodLabel} />}
        description="Recebemos o seu pagamento e o pedido já seguiu para o vendedor."
        supraLabel="Pagamento confirmado"
        title={`Pedido ${order.orderNumber}`}
      />

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-8 md:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,368px)]">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PaymentSectionTitle>O que acontece agora</PaymentSectionTitle>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#15803D]">
                <CheckIcon className="h-3 w-3" />
                Pagamento aprovado
              </span>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              Não é preciso fazer mais nada por aqui. Guardamos o pedido no seu perfil e avisamos a
              cada mudança de situação.
            </p>

            <div className="mt-6">
              <PaymentMethodPanel
                asideLabel={receiptIssuedAt ?? "Disponível agora"}
                asideTitle={receiptIssuedAt ? "Emitido em" : "Situação"}
                icon={<ReceiptIcon />}
                label="Recibo do pedido"
                sublabel="Comprovante interno do pagamento"
                plaque={
                  <PaymentPlaque caption="Recibo de pedido" className="w-full max-w-[264px]">
                    <span className="block w-full px-3 py-8 text-center font-mono text-lg font-medium leading-6 tracking-[-0.01em] text-brand-dark">
                      {receiptNumber ?? `Pedido ${order.orderNumber}`}
                    </span>
                  </PaymentPlaque>
                }
              >
                <PaymentSteps steps={nextSteps(Boolean(receiptNumber))} />

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-yellow px-6 text-xs font-black uppercase tracking-[0.14em] text-brand-dark transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                    download
                    href={`/api/profile/orders/${order.id}/receipt`}
                  >
                    <ReceiptIcon className="h-4 w-4" />
                    Baixar recibo
                  </a>
                  <Link
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-brand-dark px-6 text-xs font-black uppercase tracking-[0.14em] text-brand-dark transition hover:bg-brand-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                    href="/produtos"
                  >
                    Continuar comprando
                  </Link>
                </div>
              </PaymentMethodPanel>
            </div>
          </div>

          <OrderPaymentSummary order={order} />
        </div>
      </section>
    </main>
  );
}
