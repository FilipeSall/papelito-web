import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  getAdminVendorDetail,
  getAdminVendorsSnapshot,
} from "@/lib/server/admin-vendors";
import { firstParam } from "@/lib/search-params";
import type { AdminVendorsPageSearchParams } from "@/lib/server/admin-vendors-filters";
import {
  buildAdminVendorsQuery,
  parseAdminVendorsFilters,
} from "@/lib/server/admin-vendors-filters";

import { VendorDetailDrawer, VendorsList, VendorsMetrics, VendorsTabs } from "./vendors";

export async function VendorsContent({
  searchParams,
}: {
  searchParams?: AdminVendorsPageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const filters = parseAdminVendorsFilters(searchParams);
  const snapshot = await getAdminVendorsSnapshot(session?.accessToken, filters);

  const rawVendorId = firstParam(searchParams?.vendor);
  const vendorId = rawVendorId ? Number.parseInt(rawVendorId, 10) : NaN;
  const detail =
    Number.isFinite(vendorId) && vendorId > 0
      ? await getAdminVendorDetail(session?.accessToken, vendorId)
      : null;

  const closeQuery = buildAdminVendorsQuery(filters, {});
  const closeHref = closeQuery ? `?${closeQuery}` : "/admin/vendors";

  return (
    <>
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
      {detail ? <VendorDetailDrawer closeHref={closeHref} vendor={detail} /> : null}
    </>
  );
}
