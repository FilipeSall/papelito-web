import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { CompanyDetailPage } from "@/components/layout/admin-panel/sections/accounts";
import { authOptions } from "@/lib/auth";
import { getAdminCompanyDetail } from "@/lib/server/admin-companies";
import { fetchCurrentUserRole } from "@/lib/server/current-user-role";

export default async function AdminCompanyDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !session.accessToken ||
    (await fetchCurrentUserRole(session.accessToken)) !== "administrator"
  ) {
    notFound();
  }

  const { id } = await params;
  const companyId = Number.parseInt(id, 10);

  if (!Number.isFinite(companyId) || companyId <= 0) {
    notFound();
  }

  const detail = await getAdminCompanyDetail(session.accessToken, companyId);

  if (!detail) {
    notFound();
  }

  return <CompanyDetailPage detail={detail} />;
}
