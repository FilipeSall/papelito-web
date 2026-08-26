import { CheckoutAddressStepContent } from "@/components/layout/checkout-page/checkout-address-step-content";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";
import { fetchCompanyContext } from "@/lib/server/company-api";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Checkout");

export default async function CheckoutPage() {
  const session = await requireCheckoutCustomer("/checkout");
  const companyResult = await fetchCompanyContext(session.accessToken!);
  const company = companyResult.ok ? companyResult.data.company : null;

	return <CheckoutAddressStepContent company={company ? { legalName: company.legalName, cnpj: company.cnpj } : null} />;
}
