import { CheckoutAddressStepContent } from "@/components/layout/checkout-page/checkout-address-step-content";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";
import { fetchProfileCustomer } from "@/features/profile/server/customer";

export default async function CheckoutPage() {
  const session = await requireCheckoutCustomer("/checkout");
  const customer = await fetchProfileCustomer(session.accessToken);
  const initialDocument = customer.meta.cpf || customer.meta.cnpj || "";

  return <CheckoutAddressStepContent initialDocument={initialDocument} />;
}
