import Link from "next/link";
import { notFound } from "next/navigation";

import { Panel } from "@/components/layout/operational-panel";
import {
  VendorContactCustomerButton,
  VendorOrderActions,
  VendorOrderDeliveryCountdown,
  VendorOrderStatusBadge,
  VendorOrderStatusStepper,
  VendorPageHeader,
} from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorOrderDetail } from "@/features/vendor-orders/server";
import type { VendorOrderDetail } from "@/features/vendor-orders/types/vendor-orders";
import { formatBRLIntl } from "@/lib/format-currency";

function currentTimestamp() {
  return Date.now();
}

function address(order: VendorOrderDetail) {
  const { shippingAddress } = order;
  return [
    shippingAddress.address1,
    shippingAddress.address2,
    [shippingAddress.city, shippingAddress.state].filter(Boolean).join(" - "),
    shippingAddress.postcode ? `CEP ${shippingAddress.postcode}` : "",
  ].filter(Boolean).join(", ") || "Endereco nao informado.";
}

export default async function VendorOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await redirectIfVendorOnboardingPending(`/vendor/pedidos/${id}`);

  const order = await getVendorOrderDetail(id);

  if (!order) notFound();

  const now = currentTimestamp();

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        action={
          <VendorOrderDeliveryCountdown
            deliveryTimeDays={order.deliveryTimeDays}
            now={now}
            paidAt={order.paidAt}
            status={order.status}
          />
        }
        description={`Pedido #${order.orderNumber} atendido pela sua loja. Os dados de entrega abaixo sao disponibilizados para expedicao.`}
        eyebrow="Detalhe de pedido"
        title={`Pedido #${order.orderNumber}`}
      />
      <Link
        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark/66 transition-colors hover:text-brand-dark"
        href="/vendor/pedidos"
      >
        &larr; Voltar aos pedidos
      </Link>
      <Panel className="p-5 md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48">Rastreamento</p>
        <div className="mt-5">
          <VendorOrderStatusStepper status={order.status} />
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel className="p-5 md:p-6">
          <div className="flex flex-col gap-4 border-b border-brand-dark/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48">Atendimento</p>
              <p className="mt-2 text-xl font-semibold">{order.customerName}</p>
              <p className="mt-1 text-sm text-brand-dark/62">{order.phone || "Telefone nao informado"}</p>
            </div>
            <VendorOrderStatusBadge status={order.status} />
          </div>
          <div className="mt-5 rounded-xl bg-brand-dark/3 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48">Endereco de entrega</p>
            <p className="mt-3 text-sm leading-6 text-brand-dark/74">{address(order)}</p>
            <p className="mt-3 text-sm text-brand-dark/62">
              {order.shippingService || "Servico de entrega nao informado"}
              {order.deliveryTimeDays > 0 ? ` - prazo estimado ${order.deliveryTimeDays} dias uteis` : ""}
            </p>
          </div>
          <VendorOrderActions orderId={order.id} status={order.status} />
        </Panel>
        <Panel className="overflow-hidden">
          <div className="border-b border-brand-dark/10 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48">Itens e valores</p>
          </div>
          <div className="space-y-3 px-5 py-5">
            {order.items.map((item) => (
              <div className="flex justify-between gap-3 text-sm" key={item.itemId}>
                <span>{item.name} <span className="text-brand-dark/48">x{item.qty}</span></span>
                <span className="font-semibold">{formatBRLIntl(item.total)}</span>
              </div>
            ))}
            <div className="mt-4 space-y-2 border-t border-brand-dark/10 pt-4 text-sm">
              <div className="flex justify-between text-brand-dark/62"><span>Subtotal</span><span>{formatBRLIntl(order.subtotal)}</span></div>
              <div className="flex justify-between text-brand-dark/62"><span>Frete</span><span>{formatBRLIntl(order.shippingTotal)}</span></div>
              <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{formatBRLIntl(order.total)}</span></div>
            </div>
          </div>
        </Panel>
      </div>
      <VendorContactCustomerButton orderId={order.id} />
    </div>
  );
}
