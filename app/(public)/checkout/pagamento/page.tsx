import { CheckoutPaymentStepContent } from "@/components/layout/checkout-page/checkout-payment-step-content";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Pagamento");

export default async function CheckoutPagamentoPage() {
  await requireCheckoutCustomer("/checkout/pagamento");

  return <CheckoutPaymentStepContent />;
}
