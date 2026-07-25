import { getServerSession } from "next-auth";

import { RevendedorPage } from "@/components/layout/revendedor-page";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";
import { fetchProfileCustomer } from "@/features/profile/server/customer";
import { fetchVendorInterest } from "@/features/revendedor/server/vendor-interest";
import { normalizeStep1Data } from "@/features/revendedor/utils/revendedor-registration";
import { authOptions } from "@/lib/auth";
import { fetchCurrentUserRole } from "@/lib/server/current-user-role";

export default async function RevendedorRoutePage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user && session.accessToken);

  const [customer, interest, images, role] = await Promise.all([
    session?.accessToken ? fetchProfileCustomer(session.accessToken) : null,
    fetchVendorInterest(session?.accessToken),
    getSiteImageAssets(),
    session?.accessToken ? fetchCurrentUserRole(session.accessToken) : undefined,
  ]);

  const initialValues = normalizeStep1Data(
    customer
      ? {
          storeName: customer.meta.storeName || customer.billing.company,
          firstName: customer.firstName || customer.billing.firstName,
          lastName: customer.lastName || customer.billing.lastName,
          cnpj: customer.meta.cnpj,
          phone: customer.meta.phoneNumber || customer.billing.phone,
          email: customer.email || customer.billing.email,
          instagram: customer.meta.instagram,
        }
      : undefined,
  );

  return (
    <RevendedorPage
      interest={interest}
      images={images}
      initialValues={initialValues}
      isAuthenticated={isAuthenticated}
      role={role}
    />
  );
}
