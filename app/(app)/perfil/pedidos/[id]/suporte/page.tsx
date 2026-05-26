import Link from "next/link";
import { notFound } from "next/navigation";

import { MessageThreadPanel, getOrderSupportThread } from "@/features/messages";
import { getProfileOrderDetail } from "@/features/orders";

export default async function OrderSupportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, thread] = await Promise.all([getProfileOrderDetail(id), getOrderSupportThread(id)]);

  if (!order) notFound();

  return (
    <section className="min-h-screen bg-bg-light">
      <div className="bg-brand-dark">
        <div className="mx-auto w-full max-w-5xl px-5 py-7 md:px-8">
          <Link className="text-sm font-semibold text-white/65 transition hover:text-white" href={`/perfil/pedidos/${id}`}>
            &larr; Voltar ao pedido
          </Link>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-yellow">Suporte do pedido</p>
          <h1 className="mt-2 text-3xl font-black text-white">Pedido {order.orderNumber}</h1>
          <p className="mt-2 text-sm text-white/58">
            Fale primeiro com {order.storeLabel}. Se necessario, a Papelito pode acompanhar a mesma conversa.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-5 py-7 md:px-8">
        <MessageThreadPanel
          canEscalate
          canStart
          initialThread={thread}
          orderId={Number(order.id)}
        />
      </div>
    </section>
  );
}
