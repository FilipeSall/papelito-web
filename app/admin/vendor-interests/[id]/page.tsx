import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { VendorInterestDetailPage } from "@/components/layout/admin-panel/sections/vendor-interest-detail-page";
import { authOptions } from "@/lib/auth";
import { getAdminVendorInterest } from "@/lib/server/admin-vendor-interests";

export default async function AdminVendorInterestDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const interestId = Number.parseInt(id, 10);
  const interest = await getAdminVendorInterest(session?.accessToken, interestId);

  if (!interest) notFound();

  return <VendorInterestDetailPage interest={interest} />;
}

