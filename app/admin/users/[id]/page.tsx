import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { UserDetailPage, type UserDetailOrigin, type UserDetailTabKey } from "@/components/layout/admin-panel/sections/users";
import { authOptions } from "@/lib/auth";
import { getAdminUserDetail } from "@/lib/server/admin-users";
import type { AdminUserFilterRole } from "@/lib/server/admin-users-filters";
import { normalizeAdminRole } from "@/lib/server/admin-vendor-filters";
import { firstParam } from "@/lib/search-params";

function parseTab(value: string | undefined): UserDetailTabKey {
  return value === "orders" || value === "sales" || value === "role" ? value : "overview";
}

function parseOriginRole(value: string | undefined): AdminUserFilterRole {
  return value === "administrator" || value === "customer" || value === "seller" || value === "other"
    ? value
    : "all";
}

export default async function AdminUserDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const role = normalizeAdminRole(session?.role);

  if (!session?.user || !session.accessToken || role !== "administrator") {
    notFound();
  }

  const { id } = await params;
  const userId = Number.parseInt(id, 10);
  if (!Number.isFinite(userId) || userId <= 0) {
    notFound();
  }

  const user = await getAdminUserDetail(session.accessToken, userId);
  if (!user) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = parseTab(firstParam(resolvedSearchParams.tab));
  const origin: UserDetailOrigin = {
    page: Math.max(1, Number.parseInt(firstParam(resolvedSearchParams.originPage) ?? "", 10) || 1),
    role: parseOriginRole(firstParam(resolvedSearchParams.originRole)),
    search: firstParam(resolvedSearchParams.originSearch)?.trim() ?? "",
  };

  return <UserDetailPage activeTab={activeTab} origin={origin} user={user} />;
}
