"use client";

type PaymentMethod = {
  /** Identificador unico do cartao */
  id: string;
  /** Bandeira do cartao (VISA, Mastercard, etc) */
  brand: string;
  /** Ultimos 4 digitos do cartao */
  lastFourDigits: string;
  /** Nome do titular */
  holderName: string;
  /** Data de validade (MM/AA) */
  expiryDate: string;
  /** Se este e o cartao padrao */
  isDefault?: boolean;
};

type PaymentCardProps = {
  /** Dados do cartao */
  payment: PaymentMethod;
  /** Callback ao clicar no cartao */
  onClick?: (id: string) => void;
};

/**
 * Icone de cartao de credito para indicar selecao.
 */
function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        height="13.333"
        rx="2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        width="16.667"
        x="1.667"
        y="3.333"
      />
      <path
        d="M1.667 8.333H18.333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Card de cartao de credito/debito do usuario.
 *
 * Exibe informacoes do cartao cadastrado em um design
 * estilo cartao de credito com fundo escuro.
 *
 * @example
 * ```tsx
 * <PaymentCard
 *   payment={{
 *     id: "1",
 *     brand: "VISA",
 *     lastFourDigits: "4242",
 *     holderName: "Joao Silva",
 *     expiryDate: "12/28",
 *     isDefault: true,
 *   }}
 * />
 * ```
 */
export function PaymentCard({ payment, onClick }: PaymentCardProps) {
  return (
    <button
      className="relative h-40 w-full rounded-2xl bg-brand-dark p-6 text-left transition-opacity hover:opacity-90"
      onClick={() => onClick?.(payment.id)}
      type="button"
    >
      {/* Header: Bandeira e icone */}
      <div className="flex items-start justify-between">
        <span className="text-sm font-black tracking-widest text-white">
          {payment.brand}
        </span>
        <CreditCardIcon className="h-5 w-5 text-white/60" />
      </div>

      {/* Numero do cartao */}
      <p className="mt-6 text-lg tracking-widest text-white">
        •••• •••• •••• {payment.lastFourDigits}
      </p>

      {/* Footer: Nome e validade */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-white/60">{payment.holderName}</span>
        <span className="text-xs text-white/60">{payment.expiryDate}</span>
      </div>
    </button>
  );
}

export type { PaymentMethod };
