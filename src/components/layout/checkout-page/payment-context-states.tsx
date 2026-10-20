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
