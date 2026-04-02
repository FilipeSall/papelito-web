"use client";

import { AddPaymentCard } from "./add-payment-card";
import { PaymentCard, PaymentMethod } from "./payment-card";

type PaymentListProps = {
  /** Lista de cartoes do usuario */
  payments: PaymentMethod[];
  /** Callback ao clicar em um cartao */
  onSelect?: (id: string) => void;
  /** Callback ao clicar em adicionar novo cartao */
  onAdd?: () => void;
};

/**
 * Lista de formas de pagamento do usuario.
 *
 * Exibe os cartoes cadastrados em um grid responsivo
 * com opcao de adicionar novos cartoes.
 *
 * @example
 * ```tsx
 * <PaymentList
 *   payments={payments}
 *   onSelect={(id) => handleSelect(id)}
 *   onAdd={() => handleAdd()}
 * />
 * ```
 */
export function PaymentList({ payments, onSelect, onAdd }: PaymentListProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-black uppercase tracking-tight text-brand-dark">
        Formas de Pagamento
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {payments.map((payment) => (
          <PaymentCard
            key={payment.id}
            onClick={onSelect}
            payment={payment}
          />
        ))}
        <AddPaymentCard onClick={onAdd} />
      </div>
    </div>
  );
}
