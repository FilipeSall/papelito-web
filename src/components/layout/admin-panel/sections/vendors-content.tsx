import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminVendorsSnapshot } from "@/lib/server/admin-vendors";
import type { AdminVendorsPageSearchParams } from "@/lib/server/admin-vendors-filters";
import {
  parseAdminVendorsFilters,
} from "@/lib/server/admin-vendors-filters";

import { VendorsList, VendorsMetrics, VendorsTabs } from "./vendors";

export async function VendorsContent({
  searchParams,
}: {
  searchParams?: AdminVendorsPageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const filters = parseAdminVendorsFilters(searchParams);
  const snapshot = await getAdminVendorsSnapshot(session?.accessToken, filters);

  return (
    <div className="space-y-5">
      <VendorsMetrics summary={snapshot.summary} totalRows={snapshot.totalRows} />
      <VendorsTabs filters={filters} summary={snapshot.summary} totalRows={snapshot.totalRows} />
      <VendorsList filters={filters} snapshot={snapshot} />
      {snapshot.issues.length > 0 && snapshot.rows.length > 0 ? (
        <p className="rounded-xl border border-[#d7b0aa] bg-[#fef3f1] px-4 py-3 text-xs leading-5 text-[#7a3428]">
          {snapshot.issues.join(" • ")}
        </p>
      ) : null}
    </div>
  );
}
