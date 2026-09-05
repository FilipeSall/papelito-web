import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPinOff, TriangleAlert } from "lucide-react";

import { FOCUS_RING, InlineAlert, StatusChip } from "@/components/layout/operational-panel";
import { OrderStatusAutoRefresh } from "@/components/layout/order-status-auto-refresh";
import {
  logisticsHeadline,
  paymentMethodLabel,
  paymentStateShape,
  VendorContactCustomerButton,
  VendorOrderActions,
  VendorOrderDeliveryCountdown,
  VendorOrderDocumentsSection,
  VendorOrderStatusPanel,
  VendorPageHeader,
} from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorOrderDetail } from "@/features/vendor-orders/server";
import type { VendorOrderDetail } from "@/features/vendor-orders/types/vendor-orders";
import { parseSiteDate, parseUtcDate, SAO_PAULO } from "@/features/vendor-orders/utils/order-dates";
import { formatBRLIntl } from "@/lib/format-currency";
import { formatBusinessDays } from "@/features/shipping/utils/format-business-days";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: SAO_PAULO,
});

/**
 * Data do pedido — `created_at` e `paid_at` saem de `date_i18n()`, em hora de
 * São Paulo. Lê-las como UTC adiantava tudo em três horas.
 */
function formatOrderStamp(value: string) {
  const date = parseSiteDate(value);
  return date ? dateTimeFormatter.format(date) : value;
}

/** Evento dos Correios — gravado em UTC por `current_time( 'mysql', true )`. */
function formatEventStamp(value: string) {
  const date = parseUtcDate(value);
  return date ? dateTimeFormatter.format(date) : value;
}

function currentTimestamp() {
  return Date.now();
}

function formatCnpj(digits: string) {
  return digits.length === 14
    ? digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    : digits;
}

function formatCep(digits: string) {
  return digits.length === 8 ? digits.replace(/^(\d{5})(\d{3})$/, "$1-$2") : digits;
}

/**
 * Os blocos do payload são lidos com tolerância porque o Next e o WordPress
 * sobem em deploys separados: um payload de versão anterior chega sem
 * `shipping_address` ou sem `billing`, e derrubar a página inteira por isso
 * troca "endereço não informado" por tela de erro.
 */
function shippingAddressLines(order: VendorOrderDetail): string[] {
  const shippingAddress = order.shippingAddress ?? {
    address1: "",
    address2: "",
    city: "",
    postcode: "",
    state: "",
  };

  return [
    shippingAddress.address1,
    shippingAddress.address2,
    [shippingAddress.city, shippingAddress.state].filter(Boolean).join(" - "),
    shippingAddress.postcode ? `CEP ${formatCep(shippingAddress.postcode)}` : "",
  ].filter(Boolean);
}

function fiscalAddressLines(order: VendorOrderDetail): string[] {
  const fiscalAddress = order.billing?.fiscalAddress;

  if (!fiscalAddress) return [];

  const street = [fiscalAddress.street, fiscalAddress.number].filter(Boolean).join(", ");

  return [
    [street, fiscalAddress.complement].filter(Boolean).join(" - "),
    fiscalAddress.neighborhood,
    [fiscalAddress.city, fiscalAddress.state].filter(Boolean).join(" - "),
    fiscalAddress.postcode ? `CEP ${formatCep(fiscalAddress.postcode)}` : "",
  ].filter(Boolean);
}

function Panel({
  children,
  title,
  trailing,
}: {
  children: React.ReactNode;
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <div className="flex flex-col gap-3 border-b-2 border-[#1a1a1a] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55">
          {title}
        </h2>
        {trailing}
      </div>
      <div className="px-5 py-5 md:px-6">{children}</div>
    </section>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm leading-6 wrap-break-word text-[#231f20]/74">{value}</dd>
    </div>
  );
}

/**
 * WordPress fora do ar ou respondendo erro.
 *
 * Estado próprio, e não 404: o pedido existe, o que falhou foi a leitura — e a
 * ação útil é tentar de novo, não voltar para a lista achando que o pedido
 * sumiu.
 */
function VendorOrderLoadError({ message, orderId }: { message: string; orderId: string }) {
  return (
    <div className="space-y-4 md:space-y-5">
      <Link
        className={[
          "inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]/62 transition-colors hover:text-[#1a1a1a]",
          FOCUS_RING,
        ].join(" ")}
        href="/vendor/pedidos"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={2.6} />
        Voltar aos pedidos
      </Link>

      <Panel title={`Pedido #${orderId}`}>
        <InlineAlert icon={TriangleAlert} tone="critical">
          ⚠ {message}
        </InlineAlert>
        <p className="mt-4 text-sm leading-6 text-[#231f20]/74">
          O pedido continua registrado — o que falhou foi a leitura dele agora. Recarregue a página
          em alguns instantes; se persistir, avise o suporte da Papelito.
        </p>
      </Panel>
    </div>
  );
}

export default async function VendorOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await redirectIfVendorOnboardingPending(`/vendor/pedidos/${id}`);

  const result = await getVendorOrderDetail(id);

  if (result.status === "not-found") notFound();

  // Sessão do WordPress expirada com o cookie do Next ainda válido: o proxy
  // deixa entrar e só a leitura do pedido falha. Mandar para o login recupera o
  // token; responder 404 diria que o pedido sumiu.
  if (result.status === "unauthenticated") {
    redirect(`/entrar?callbackUrl=${encodeURIComponent(`/vendor/pedidos/${id}`)}`);
  }

  if (result.status === "error") {
    return <VendorOrderLoadError message={result.message} orderId={id} />;
  }

  const { order } = result;

  const now = currentTimestamp();
  const addressLines = shippingAddressLines(order);
  const fiscalLines = fiscalAddressLines(order);
  const paymentShape = paymentStateShape(order.payment?.state ?? "");

  return (
    <div className="space-y-4 md:space-y-5">
      <OrderStatusAutoRefresh
        active={order.logistics.generationStatus === "generating" || order.logistics.generationStatus === "uncertain"}
        intervalMs={15_000}
      />

      <Link
        className={[
          "inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]/62 transition-colors hover:text-[#1a1a1a]",
          FOCUS_RING,
        ].join(" ")}
        href="/vendor/pedidos"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={2.6} />
        Voltar aos pedidos
      </Link>

      <VendorPageHeader
        action={
          <VendorOrderDeliveryCountdown
            deliveryTimeDays={order.deliveryTimeDays}
            now={now}
            paidAt={order.paidAt}
            status={order.status}
          />
        }
        description={`${order.customerName} · ${order.itemsCount === 1 ? "1 item" : `${order.itemsCount} itens`} · ${formatBRLIntl(order.total)}`}
        eyebrow="Detalhe de pedido"
        title={`Pedido #${order.orderNumber}`}
      />

      <VendorOrderStatusPanel
        cancelReason={order.cancelReason}
        hasShipments={order.logistics.shipments.length > 0}
        nextStatuses={order.nextStatuses}
        orderId={order.id}
        status={order.status}
      />

      <div className="grid gap-4 md:gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Produtos e valores">
          <ul className="divide-y-2 divide-[#1a1a1a]/8">
            {order.items.length === 0 ? (
              <li className="py-2 text-sm text-[#231f20]/74">
                Nenhum item deste pedido é atendido pela sua loja.
              </li>
            ) : (
              order.items.map((item) => (
                <li className="flex items-start justify-between gap-4 py-3 first:pt-0" key={item.itemId}>
                  <span className="min-w-0 text-sm leading-6 text-[#231f20]/74">
                    {item.name}
                    <span className="ml-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
                      {item.qty}×
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-[#1a1a1a]">
                    {formatBRLIntl(item.total)}
                  </span>
                </li>
              ))
            )}
          </ul>

          <dl className="mt-4 space-y-2 border-t-2 border-[#1a1a1a] pt-4 text-sm">
            <div className="flex justify-between gap-4 text-[#231f20]/74">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatBRLIntl(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-[#231f20]/74">
              <dt>Frete</dt>
              <dd className="tabular-nums">{formatBRLIntl(order.shippingTotal)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t-2 border-[#1a1a1a]/10 pt-2 text-base font-black text-[#1a1a1a]">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatBRLIntl(order.total)}</dd>
            </div>
          </dl>
        </Panel>

        <Panel
          title="Entrega"
          trailing={
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/62">
              {logisticsHeadline(
                order.logistics.generationStatus,
                order.logistics.status,
                order.logistics.automaticGenerationEnabled,
              )}
            </p>
          }
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <DataRow
              label="Endereço de entrega"
              value={
                addressLines.length > 0 ? (
                  addressLines.map((line, index) => (
                    <span className="block" key={`${index}:${line}`}>
                      {line}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-2 text-[#231f20]/62">
                    <MapPinOff aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                    Endereço não informado no pedido.
                  </span>
                )
              }
            />
            <DataRow
              label="Serviço e prazo"
              value={
                <>
                  {order.shippingService || "Serviço não informado"}
                  {order.deliveryTimeDays > 0 ? (
                    <span className="block text-[#231f20]/62">
                      Prazo estimado: {formatBusinessDays(order.deliveryTimeDays)}
                    </span>
                  ) : null}
                </>
              }
            />
          </dl>

          {order.logistics.packagesTotal > 0 ? (
            <p className="mt-4 border-2 border-[#1a1a1a]/15 bg-white px-4 py-3 text-xs leading-5 text-[#231f20]/74">
              {order.logistics.packagesDelivered} de {order.logistics.packagesTotal}{" "}
              {order.logistics.packagesTotal === 1 ? "pacote entregue" : "pacotes entregues"}
              {order.logistics.lastEventAt ? ` · ${formatEventStamp(order.logistics.lastEventAt)}` : ""}
            </p>
          ) : null}
        </Panel>
      </div>

      <VendorOrderActions
        manualRegistrationEnabled={order.logistics.manualRegistrationEnabled}
        orderId={order.id}
        shipments={order.logistics.shipments}
        shippingService={order.shippingService}
        status={order.status}
      />

      <VendorOrderDocumentsSection
        initialFiscal={order.fiscal}
        orderId={order.id}
        receipt={order.receipt}
      />

      <div className="grid gap-4 md:gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Comprador e dados para a nota">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DataRow
              label="Razão social"
              value={order.billing?.legalName || order.customerName || "Não informada"}
            />
            <DataRow
              label="CNPJ"
              value={
                order.billing?.cnpj ? (
                  <span className="font-mono">{formatCnpj(order.billing.cnpj)}</span>
                ) : (
                  "Não informado"
                )
              }
            />
            <DataRow label="E-mail" value={order.billing?.email || "Não informado"} />
            <DataRow label="Telefone" value={order.billing?.phone || order.phone || "Não informado"} />
            {order.billing?.contactName ? (
              <DataRow label="Contato" value={order.billing.contactName} />
            ) : null}
            <DataRow
              label="Endereço fiscal"
              value={
                fiscalLines.length > 0
                  ? fiscalLines.map((line, index) => (
                      <span className="block" key={`${index}:${line}`}>
                        {line}
                      </span>
                    ))
                  : "Não informado no pedido."
              }
            />
          </dl>

          <div className="mt-5 border-t-2 border-[#1a1a1a]/10 pt-5">
            <VendorContactCustomerButton orderId={order.id} />
          </div>
        </Panel>

        <Panel
          title="Pagamento"
          trailing={
            <StatusChip icon={paymentShape.icon} label={paymentShape.label} tone={paymentShape.tone} />
          }
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <DataRow label="Método" value={paymentMethodLabel(order.payment?.method ?? "")} />
            <DataRow
              label="Pagamento confirmado em"
              value={formatOrderStamp(order.paidAt) || "Ainda não confirmado"}
            />
            <DataRow label="Pedido feito em" value={formatOrderStamp(order.createdAt) || "—"} />
            <DataRow
              label="Repasse"
              value="Você recebe 100% do pedido, produtos e frete; as taxas do meio de pagamento saem do seu recebimento."
            />
          </dl>
        </Panel>
      </div>
    </div>
  );
}
