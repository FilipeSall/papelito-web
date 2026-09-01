import { CheckoutAddressStepContent } from "@/components/layout/checkout-page/checkout-address-step-content";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";
import { getFreeShippingThreshold } from "@/features/shipping/services/get-free-shipping-threshold";
import { fetchCompanyContext } from "@/lib/server/company-api";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Checkout");

export default async function CheckoutPage() {
  const session = await requireCheckoutCustomer("/checkout");
  const [companyResult, freeShippingThreshold] = await Promise.all([
    fetchCompanyContext(session.accessToken!),
    getFreeShippingThreshold(),
  ]);
  const company = companyResult.ok ? companyResult.data.company : null;

	return (
		<CheckoutAddressStepContent
			freeShippingMinimumCents={freeShippingThreshold?.minimumOrderCents ?? null}
			company={
				company
					? {
							legalName: company.legalName,
							cnpj: company.cnpj,
							zipCode: company.fiscalAddress?.cep ?? null,
						}
					: null
			}
		/>
	);
}
