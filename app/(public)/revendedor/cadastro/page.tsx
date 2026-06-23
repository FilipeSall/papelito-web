import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { RevendedorRegistrationWizard } from "@/components/layout/revendedor-page/organisms/revendedor-registration-wizard";
import { fetchProfileCustomer } from "@/features/profile/server/customer";
import { fetchRevendedorApplication } from "@/features/revendedor/server/application";
import { buildDraftFromSources } from "@/features/revendedor/utils/revendedor-registration";
import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";
import { authOptions } from "@/lib/auth";

export default async function RevendedorCadastroPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user && session.accessToken);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const editMode = resolvedSearchParams.edit === "pagarme" ? "pagarme" : null;
  const returnToValue = resolvedSearchParams.returnTo;
  const returnTo =
    typeof returnToValue === "string" && returnToValue.startsWith("/")
      ? returnToValue
      : undefined;

  if (editMode === "pagarme" && isAuthenticated) {
    redirect(buildVendorOnboardingHref(returnTo));
  }

  const [customer, application] = await Promise.all([
    isAuthenticated ? fetchProfileCustomer(session?.accessToken) : null,
    fetchRevendedorApplication(session?.accessToken),
  ]);

  return (
    <RevendedorRegistrationWizard
      application={application}
      editMode={editMode}
      initialDraft={buildDraftFromSources(customer, application)}
      isAuthenticated={isAuthenticated}
      returnTo={returnTo}
    />
  );
}
