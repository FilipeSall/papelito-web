import { getServerSession } from "next-auth";

import { RevendedorPage } from "@/components/layout/revendedor-page";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";
import { fetchProfileCustomer } from "@/features/profile/server/customer";
import { fetchRevendedorApplication } from "@/features/revendedor/server/application";
import { authOptions } from "@/lib/auth";

export default async function RevendedorRoutePage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user && session.accessToken);

  const [customer, application, images] = await Promise.all([
    isAuthenticated ? fetchProfileCustomer(session?.accessToken) : null,
    isAuthenticated ? fetchRevendedorApplication(session?.accessToken) : null,
    getSiteImageAssets(),
  ]);

  return (
    <RevendedorPage
      application={
        application ?? {
          status: "none",
          submittedAt: "",
          storeName: "",
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          cnpj: "",
          instagram: "",
          state: "",
          city: "",
          discoveryChannel: "",
          hasSoldPapelito: "",
        }
      }
      images={images}
      initialValues={
        customer
          ? {
              storeName: customer.meta.storeName,
              firstName: customer.firstName,
              lastName: customer.lastName,
              cnpj: customer.meta.cnpj,
              phone: customer.meta.phoneNumber || customer.billing.phone,
              email: customer.email,
              instagram: customer.meta.instagram,
              city: customer.meta.city || customer.billing.city,
              state: customer.meta.state || customer.billing.state,
              discoveryChannel: application?.discoveryChannel ?? "",
              hasSoldPapelito:
                application?.hasSoldPapelito === "sim" || application?.hasSoldPapelito === "nao"
                  ? application.hasSoldPapelito
                  : "",
            }
          : undefined
      }
      isAuthenticated={isAuthenticated}
    />
  );
}
