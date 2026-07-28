import Link from "next/link";
import { notFound } from "next/navigation";

import { Panel } from "@/components/layout/operational-panel";
import { OrderStatusAutoRefresh } from "@/components/layout/order-status-auto-refresh";
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
  ].filter(Boolean).join(", ") || "Endereço não informado.";
}

const logisticsLabels = {
  not_started: "Aguardando geração da etiqueta",
  tracking_pending: "Aguardando eventos dos Correios",
  preposted: "Etiqueta gerada; aguardando postagem",
  posted: "Objeto postado",
  in_transit: "Objeto em transito",
  out_for_delivery: "Objeto saiu para entrega",
  pickup_available: "Objeto disponível para retirada",
  delivery_failed: "Tentativa de entrega sem sucesso",
  returning: "Objeto em devolução",
  returned: "Objeto devolvido ao remetente",
  lost: "Ocorrência logística; acompanhamento necessário",
  cancelled: "Pre-postagem cancelada",
  expired: "Pre-postagem expirada",
  delivered: "Entrega confirmada pelos Correios",
} as const;

const generationLabels = {
  failed: "Não foi possível gerar a etiqueta",
  generated: "Etiqueta gerada",
  generating: "Geração da etiqueta em andamento",
  not_started: "Aguardando geração da etiqueta",
  uncertain: "Geração com resultado incerto; revisão do suporte necessária",
} as const;

function formatLogisticsDate(value: string) {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default async function VendorOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await redirectIfVendorOnboardingPending(`/vendor/pedidos/${id}`);

  const order = await getVendorOrderDetail(id);

  if (!order) notFound();

  const now = currentTimestamp();

  return (
    <div className="space-y-4 md:space-y-5">
      <OrderStatusAutoRefresh
        active={order.logistics.generationStatus === "generating" || order.logistics.generationStatus === "uncertain"}
        intervalMs={15_000}
      />
      <VendorPageHeader
        action={
          <VendorOrderDeliveryCountdown
            deliveryTimeDays={order.deliveryTimeDays}
            now={now}
            paidAt={order.paidAt}
            status={order.status}
          />
        }
        description={`Pedido #${order.orderNumber} atendido pela sua loja. Os dados de entrega abaixo sao disponibilizados para expedição.`}
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
        <div className="mt-5 rounded-xl bg-brand-dark/3 px-4 py-3" aria-live="polite">
          <p className="text-sm font-semibold text-brand-dark">
            {order.logistics.generationStatus === "generated"
              ? logisticsLabels[order.logistics.status]
              : generationLabels[order.logistics.generationStatus]}
          </p>
          {order.logistics.packagesTotal > 0 ? (
            <p className="mt-1 text-xs text-brand-dark/60">
              {order.logistics.packagesDelivered} de {order.logistics.packagesTotal} pacote(s) entregue(s)
              {order.logistics.lastEventAt ? ` · ${formatLogisticsDate(order.logistics.lastEventAt)}` : ""}
            </p>
          ) : null}
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel className="p-5 md:p-6">
          <div className="flex flex-col gap-4 border-b border-brand-dark/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48">Atendimento</p>
              <p className="mt-2 text-xl font-semibold">{order.customerName}</p>
              <p className="mt-1 text-sm text-brand-dark/62">{order.phone || "Telefone não informado"}</p>
            </div>
            <VendorOrderStatusBadge status={order.status} />
          </div>
          <div className="mt-5 rounded-xl bg-brand-dark/3 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48">Endereço de entrega</p>
            <p className="mt-3 text-sm leading-6 text-brand-dark/74">{address(order)}</p>
            <p className="mt-3 text-sm text-brand-dark/62">
              {order.shippingService || "Serviço de entrega não informado"}
              {order.deliveryTimeDays > 0 ? ` - prazo estimado ${order.deliveryTimeDays} dias úteis` : ""}
            </p>
          </div>
          {order.logistics.shipments.length > 0 ? (
            <div className="mt-5 space-y-3" aria-label="Pacotes dos Correios">
              {order.logistics.shipments.map((shipment, index) => (
                <div className="rounded-xl border border-brand-dark/10 p-4" key={shipment.id}>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-dark/50">
                    Pacote {index + 1}
                  </p>
                  <p className="mt-2 font-mono text-sm font-bold tracking-widest">
                    {shipment.trackingCode || generationLabels[shipment.generationStatus]}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{logisticsLabels[shipment.status]}</p>
                  {shipment.labelAvailable ? (
                    <a
                      className="mt-3 inline-flex rounded-full border border-brand-dark px-4 py-2 text-xs font-semibold uppercase tracking-widest transition hover:bg-brand-dark/5"
                      href={`/api/vendor/orders/${order.id}/shipments/${shipment.id}/label`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Baixar ou reimprimir etiqueta
                    </a>
                  ) : null}
                  {shipment.lastEventDescription ? (
                    <p className="mt-1 text-xs text-brand-dark/60">
                      {shipment.lastEventDescription}
                      {shipment.lastEventLocation ? ` · ${shipment.lastEventLocation}` : ""}
                      {shipment.lastEventAt ? ` · ${formatLogisticsDate(shipment.lastEventAt)}` : ""}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          <VendorOrderActions
            manualRegistrationEnabled={order.logistics.manualRegistrationEnabled}
            orderId={order.id}
            shipments={order.logistics.shipments}
            shippingService={order.shippingService}
            status={order.status}
          />
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
