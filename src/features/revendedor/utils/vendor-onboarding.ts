export function buildVendorOnboardingHref(returnTo?: string): string {
  if (typeof returnTo === "string" && returnTo.startsWith("/")) {
    return `/vendor/onboarding?returnTo=${encodeURIComponent(returnTo)}`;
  }

  return "/vendor/onboarding";
}
