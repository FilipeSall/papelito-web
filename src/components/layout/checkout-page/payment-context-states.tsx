import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";

import { CheckoutNotice } from "./checkout-notice";

type PaymentContextErrorProps = {
  message: string;
  onRetry: () => void;
};

/** Enquanto o backend resolve o gateway, nenhum meio de pagamento é oferecido. */
export function PaymentContextLoading() {
  return (
    <LogoSpinnerLoader
      className="mt-6 min-h-40"
      label="Carregando formas de pagamento"
      layout="inline"
      size="sm"
    />
  );
}

/** Erro ao resolver o gateway: mensagem do catálogo e nova tentativa, sem presumir um gateway. */
export function PaymentContextError({ message, onRetry }: Readonly<PaymentContextErrorProps>) {
  return (
    <div className="mt-6">
      <CheckoutNotice tone="error">{message}</CheckoutNotice>
      <button
        className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-brand-dark underline underline-offset-4 transition hover:text-text-secondary"
        type="button"
        onClick={onRetry}
      >
        Tentar de novo
      </button>
    </div>
  );
}

/**
 * Explica o pagamento pelo Checkout Pro: o comprador escolhe Pix, cartão ou boleto no
 * Mercado Pago, e a Papelito não pede nem guarda dados de cartão.
 */
export function MercadoPagoPaymentInfo() {
  return (
    <div className="mt-6 rounded-[14px] border border-[#E5E7EB] bg-[#FCFCFD] p-4">
      <p className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">Pagamento pelo Mercado Pago</p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        Ao finalizar, você segue para o ambiente seguro do Mercado Pago e escolhe lá como pagar: Pix,
        cartão ou boleto. Nenhum dado de cartão é digitado na Papelito.
      </p>
    </div>
  );
}
