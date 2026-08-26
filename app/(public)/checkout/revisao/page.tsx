import { CheckoutReviewStepContent } from "@/components/layout/checkout-page/checkout-review-step-content";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Revisão do pedido");

export default async function CheckoutRevisaoPage() {
  await requireCheckoutCustomer("/checkout/revisao");

  return <CheckoutReviewStepContent />;
}
