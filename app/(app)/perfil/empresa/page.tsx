import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { CompanyDashboard } from "@/components/layout/company-page";
import { authOptions } from "@/lib/auth";
import { fetchCompanyContext, type CompanyContext } from "@/lib/server/company-api";

export const dynamic = "force-dynamic";

const FALLBACK_CONTEXT: CompanyContext = {
  identityStatus: "incomplete",
  companyId: null,
  companyStatus: null,
  companyRegistryStatus: null,
  companyOwnershipStatus: null,
  membershipRole: null,
  membershipStatus: null,
  onboardingStatus: "none",
  companySelectionRequired: false,
  availableCompanies: [],
  canPurchase: false,
};

export default async function CompanyProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect("/entrar");
  }

  const result = await fetchCompanyContext(session.accessToken);
  const context = result.ok ? result.data : FALLBACK_CONTEXT;

  return <CompanyDashboard initialContext={context} />;
}
