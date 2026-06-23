import { VendorPendingRegistrationModalHost } from "@/components/layout/vendor-panel";

export default async function VendorOnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const returnToValue = params.returnTo;
  const returnTo =
    typeof returnToValue === "string" && returnToValue.startsWith("/")
      ? returnToValue
      : undefined;

  return (
    <VendorPendingRegistrationModalHost
      dismissible={false}
      mode="page"
      returnTo={returnTo}
    />
  );
}
