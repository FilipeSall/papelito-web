import { redirect } from "next/navigation";

import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";

export default async function RevendedorCadastroPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const returnToValue = resolvedSearchParams.returnTo;
  const returnTo =
    typeof returnToValue === "string" && returnToValue.startsWith("/")
      ? returnToValue
      : undefined;

  if (resolvedSearchParams.edit === "pagarme") {
    redirect(buildVendorOnboardingHref(returnTo));
  }

  redirect("/revendedor");
}

