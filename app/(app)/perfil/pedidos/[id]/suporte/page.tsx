import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfilePageTitle } from "@/components/layout/profile-page";
import { MessageThreadPanel, getOrderSupportThread } from "@/features/messages";
import { getProfileOrderDetail } from "@/features/orders";

export default async function OrderSupportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, thread] = await Promise.all([getProfileOrderDetail(id), getOrderSupportThread(id)]);

  if (!order) notFound();

  return (
    <section className="flex flex-col gap-7">
      <Link
        className="inline-flex w-fit items-center gap-2 border-b-2 border-transparent text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a] hover:text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
        href={`/perfil/pedidos/${id}`}
      >
        <svg
          aria-hidden
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Voltar ao pedido
      </Link>

      <ProfilePageTitle
        description={`Pedido ${order.orderNumber}. Fale primeiro com ${order.storeLabel}; se necessário, a Papelito acompanha a mesma conversa.`}
        title="Suporte do pedido"
      />

      <MessageThreadPanel
        canEscalate
        canStart
        initialThread={thread}
        orderId={Number(order.id)}
      />
    </section>
  );
}
