import { CheckoutAddressStepContent } from "@/components/layout/checkout-page/checkout-address-step-content";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";
import { fetchProfileCustomer } from "@/features/profile/server/customer";
import { fetchCompanyContext } from "@/lib/server/company-api";

export default async function CheckoutPage() {
  const session = await requireCheckoutCustomer("/checkout");
  const customer = await fetchProfileCustomer(session.accessToken);
  const companyResult = await fetchCompanyContext(session.accessToken!);
  const company = companyResult.ok ? companyResult.data.company : null;
  const initialDocument = customer.meta.cpf || customer.meta.cnpj || "";

	return <CheckoutAddressStepContent initialDocument={initialDocument} company={company ? { legalName: company.legalName, cnpj: company.cnpj } : null} isB2b={companyResult.ok && companyResult.data.isB2bCohort === true} />;
}
