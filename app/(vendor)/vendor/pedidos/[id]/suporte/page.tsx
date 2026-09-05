import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { VendorPageHeader } from "@/components/layout/vendor-panel";
import { MessageThreadPanel, getOrderSupportThread } from "@/features/messages";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorOrderDetail } from "@/features/vendor-orders/server";

export default async function VendorOrderSupportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await redirectIfVendorOnboardingPending(`/vendor/pedidos/${id}/suporte`);

  const [result, thread] = await Promise.all([getVendorOrderDetail(id), getOrderSupportThread(id)]);

  if (result.status === "not-found") notFound();

  // Mesma separação do detalhe: sessão morta manda para o login, e falha de
  // leitura volta ao pedido em vez de afirmar que ele não existe.
  if (result.status === "unauthenticated") {
    redirect(`/entrar?callbackUrl=${encodeURIComponent(`/vendor/pedidos/${id}/suporte`)}`);
  }

  if (result.status === "error") {
    redirect(`/vendor/pedidos/${id}`);
  }

  const { order } = result;

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description={`Conversa referente ao pedido #${order.orderNumber} com ${order.customerName}.`}
        eyebrow="Atendimento"
        signal={thread?.escalatedAt ? "Papelito acompanhando" : "Direto com cliente"}
        title="Mensagens"
      />
      <Link
        className="inline-flex text-sm font-semibold text-brand-dark/66 transition-colors hover:text-brand-dark"
        href={`/vendor/pedidos/${id}`}
      >
        &larr; Voltar ao pedido
      </Link>
      <MessageThreadPanel canStart initialThread={thread} orderId={order.id} />
    </div>
  );
}
