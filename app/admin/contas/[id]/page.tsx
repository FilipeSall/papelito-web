import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import {
  UserDetailPage,
  type UserDetailOrigin,
  type UserDetailTabKey,
} from "@/components/layout/admin-panel/sections/users";
import { authOptions } from "@/lib/auth";
import { getAdminOwnerApplications, getAdminUserDetail } from "@/lib/server/admin-users";
import {
  ADMIN_USER_RELATIONS,
  ADMIN_USER_ROLES,
  ADMIN_USER_STATUSES,
  type AdminUserFilterRelation,
  type AdminUserFilterRole,
  type AdminUserFilterStatus,
} from "@/lib/server/admin-users-filters";
import { fetchCurrentUserRole } from "@/lib/server/current-user-role";
import { firstParam } from "@/lib/search-params";

function parseTab(value: string | undefined): UserDetailTabKey {
  return value === "orders" ||
    value === "sales" ||
    value === "role" ||
    value === "conta" ||
    value === "company-review"
    ? value
    : "overview";
}

function parseOriginRole(value: string | undefined): AdminUserFilterRole {
  return (ADMIN_USER_ROLES as readonly string[]).includes(value ?? "")
    ? (value as AdminUserFilterRole)
    : "all";
}

function parseOriginStatus(value: string | undefined): AdminUserFilterStatus {
  return (ADMIN_USER_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as AdminUserFilterStatus)
    : "all";
}

function parseOriginRelation(value: string | undefined): AdminUserFilterRelation {
  return (ADMIN_USER_RELATIONS as readonly string[]).includes(value ?? "")
    ? (value as AdminUserFilterRelation)
    : "all";
}

export default async function AdminAccountDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
  const userId = Number.parseInt(id, 10);

  if (!Number.isFinite(userId) || userId <= 0) {
    notFound();
  }

  const [user, ownerApplications] = await Promise.all([
    getAdminUserDetail(session.accessToken, userId),
    getAdminOwnerApplications(session.accessToken, userId),
  ]);

  if (!user) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const origin: UserDetailOrigin = {
    page: Math.max(1, Number.parseInt(firstParam(resolvedSearchParams.originPage) ?? "", 10) || 1),
    relation: parseOriginRelation(firstParam(resolvedSearchParams.originRelation)),
    role: parseOriginRole(firstParam(resolvedSearchParams.originRole)),
    search: firstParam(resolvedSearchParams.originSearch)?.trim() ?? "",
    status: parseOriginStatus(firstParam(resolvedSearchParams.originStatus)),
  };

  return (
    <UserDetailPage
      activeTab={parseTab(firstParam(resolvedSearchParams.tab))}
      ownerApplications={ownerApplications}
      origin={origin}
      user={user}
    />
  );
}
