import { CheckoutPaymentStepContent } from "@/components/layout/checkout-page/checkout-payment-step-content";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";

export default async function CheckoutPagamentoPage() {
  await requireCheckoutCustomer("/checkout/pagamento");

  return <CheckoutPaymentStepContent />;
}
