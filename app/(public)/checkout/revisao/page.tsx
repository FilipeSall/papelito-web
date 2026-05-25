import { CheckoutReviewStepContent } from "@/components/layout/checkout-page/checkout-review-step-content";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";

export default async function CheckoutRevisaoPage() {
  await requireCheckoutCustomer("/checkout/revisao");

  return <CheckoutReviewStepContent />;
}
