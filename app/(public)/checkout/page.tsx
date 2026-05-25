import { CheckoutAddressStepContent } from "@/components/layout/checkout-page/checkout-address-step-content";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";

export default async function CheckoutPage() {
  await requireCheckoutCustomer("/checkout");

  return <CheckoutAddressStepContent />;
}
