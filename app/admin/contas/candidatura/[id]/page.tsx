import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { PreAccountApplicationPage } from "@/components/layout/admin-panel/sections/accounts";
import {
  parsePreAccountApplicationId,
  preAccountApplicationBackHref,
} from "@/lib/admin-pre-account-routes";
import { authOptions } from "@/lib/auth";
import { getAdminPreAccountApplication } from "@/lib/server/admin-users";
import { fetchCurrentUserRole } from "@/lib/server/current-user-role";
import { firstParam } from "@/lib/search-params";

export default async function AdminPreAccountApplicationRoute({
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
  const applicationId = parsePreAccountApplicationId(id);

  if (applicationId <= 0) {
    notFound();
  }

  const application = await getAdminPreAccountApplication(
    session.accessToken,
    `pre:${applicationId}`,
  );

  if (!application) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};

  return (
    <PreAccountApplicationPage
      application={application}
      backHref={preAccountApplicationBackHref(firstParam(resolvedSearchParams.from))}
    />
  );
}
