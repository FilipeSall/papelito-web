import Link from "next/link";

import type { ProfileOrderDetail } from "@/features/orders/types/profile-order-detail";
import { formatBRL } from "@/lib/format-currency";

import { SecurityLockIcon } from "./checkout-icons";

/**
 * Resumo do pedido ao lado das etapas finais do checkout — pagamento pendente,
 * pagamento confirmado e prazo expirado. Só usa o que o detalhe do pedido já
 * traz: itens, totais, vendor e endereço de entrega.
 */
export function OrderPaymentSummary({ order }: { order: ProfileOrderDetail }) {
  return (
    <aside className="h-fit rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] lg:sticky lg:top-6">
      <div className="flex items-center gap-2">
        <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45 bg-brand-yellow" />
        <h2 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
          Resumo do pedido
        </h2>
      </div>

      {order.items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {order.items.map((item) => (
            <li className="flex items-start justify-between gap-3" key={item.id}>
              <p className="min-w-0 text-sm leading-5 tracking-[-0.1504px] text-text-tertiary">
                <span className="font-black text-brand-dark">{item.quantity}x</span> {item.name}
              </p>
              <p className="shrink-0 text-sm font-medium text-brand-dark">
                {formatBRL(item.unitPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 space-y-2 border-t border-[#F3F4F6] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-tertiary">Subtotal</span>
          <span className="text-sm font-medium text-brand-dark">{formatBRL(order.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-tertiary">Frete</span>
          <span className="text-sm font-medium text-brand-dark">{formatBRL(order.shipping)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between border-t border-[#F3F4F6] pt-3">
        <span className="text-lg font-black uppercase tracking-[-0.1504px] text-brand-dark">
          Total
        </span>
        <span className="text-[28px] font-black leading-8 tracking-[-0.4492px] text-brand-dark">
          {formatBRL(order.total)}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 border-t border-[#F3F4F6] pt-4 sm:grid-cols-2 lg:grid-cols-1">
        {order.storeLabel ? (
          <div>
            <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-text-tertiary">
              Vendedor
            </dt>
            <dd className="mt-1 text-sm leading-5 text-brand-dark">{order.storeLabel}</dd>
          </div>
        ) : null}

        {order.deliveryAddress ? (
          <div>
            <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-text-tertiary">
              Entrega em
            </dt>
            <dd className="mt-1 text-sm leading-5 text-text-secondary">{order.deliveryAddress}</dd>
          </div>
        ) : null}

        <div>
          <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-text-tertiary">
            Forma de pagamento
          </dt>
          <dd className="mt-1 text-sm leading-5 text-brand-dark">{order.payment.methodLabel}</dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center gap-2 rounded-[14px] bg-bg-light px-3 py-3">
        <SecurityLockIcon />
        <p className="text-xs leading-4 text-text-muted">Pagamento 100% seguro e criptografado</p>
      </div>

      <Link
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#D6D9DE] px-5 text-xs font-black uppercase tracking-[0.14em] text-brand-dark transition hover:border-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        href={`/perfil/pedidos/${order.id}`}
      >
        Ver detalhes do pedido
      </Link>
    </aside>
  );
}
