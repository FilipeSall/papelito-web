import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";
import { getProfileOrderDetail } from "@/features/orders";

type CheckoutSuccessPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function CheckoutSuccessPage({
  params,
}: CheckoutSuccessPageProps) {
  await requireCheckoutCustomer("/checkout");

  const { orderId } = await params;
  const order = await getProfileOrderDetail(orderId);

  if (!order) {
    notFound();
  }

  const paymentState = order.payment.state ?? "";

  if (paymentState !== "paid" && paymentState !== "captured") {
    if (order.payment.pix || order.payment.boleto) {
      redirect(`/checkout/pagamento/${order.id}`);
    }

    redirect(`/perfil/pedidos/${order.id}`);
  }

  return (
    <main className="bg-bg-light">
      <section className="mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-391 items-center px-6 py-12 md:px-8">
        <div className="w-full rounded-[28px] border border-[#E5E7EB] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <span className="inline-flex rounded-full bg-brand-yellow/25 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-brand-dark">
            Pedido confirmado
          </span>

          <h1 className="mt-5 text-[32px] font-black uppercase tracking-[-0.4492px] text-brand-dark">
            Pedido {order.orderNumber}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
            Seu pagamento foi confirmado e o pedido ja seguiu para processamento.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex h-12 items-center justify-center rounded-full border border-brand-dark px-6 text-sm font-black uppercase tracking-[-0.1504px] text-brand-dark transition hover:bg-brand-dark hover:text-white"
              href={`/api/profile/orders/${order.id}/receipt`}
            >
              Baixar recibo
            </a>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand-yellow px-6 text-sm font-black uppercase tracking-[-0.1504px] text-brand-dark transition hover:brightness-95"
              href="/produtos"
            >
              Continuar comprando
            </Link>

            <Link
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#D6D9DE] px-6 text-sm font-black uppercase tracking-[-0.1504px] text-brand-dark transition hover:border-brand-dark"
              href="/perfil"
            >
              Ir para meu perfil
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
