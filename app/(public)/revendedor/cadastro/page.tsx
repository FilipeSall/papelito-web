import { getServerSession } from "next-auth";

import { RevendedorRegistrationWizard } from "@/components/layout/revendedor-page/organisms/revendedor-registration-wizard";
import { fetchProfileCustomer } from "@/features/profile/server/customer";
import { fetchRevendedorApplication } from "@/features/revendedor/server/application";
import { buildDraftFromSources } from "@/features/revendedor/utils/revendedor-registration";
import { authOptions } from "@/lib/auth";

export default async function RevendedorCadastroPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user && session.accessToken);

  const [customer, application] = await Promise.all([
    isAuthenticated ? fetchProfileCustomer(session?.accessToken) : null,
    fetchRevendedorApplication(session?.accessToken),
  ]);

  return (
    <RevendedorRegistrationWizard
      application={application}
      initialDraft={buildDraftFromSources(customer, application)}
      isAuthenticated={isAuthenticated}
    />
  );
}
