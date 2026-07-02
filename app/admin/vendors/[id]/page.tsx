import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import type { DetailTabKey } from "@/components/layout/admin-panel/sections/vendors/vendor-detail-context";
import { VendorDetailPage } from "@/components/layout/admin-panel/sections/vendors/vendor-detail-page";
import { authOptions } from "@/lib/auth";
import {
  getAdminVendorOrders,
  getAdminVendorStock,
} from "@/lib/server/admin-vendor-operations";
import {
  parseStockFilter,
  parseVendorOrderStatus,
} from "@/lib/server/admin-vendor-filters";
import { getAdminVendorDetail } from "@/lib/server/admin-vendors";
import { fetchCurrentUserRole } from "@/lib/server/current-user-role";
import { firstParam } from "@/lib/search-params";

function parseTab(value: string | undefined): DetailTabKey {
  return value === "coverage" || value === "banking" || value === "stock" || value === "orders"
    ? value
    : "data";
}

export default async function AdminVendorDetailRoute({
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
  const vendorId = Number.parseInt(id, 10);
  if (!Number.isFinite(vendorId) || vendorId <= 0) {
    notFound();
  }

  const vendor = await getAdminVendorDetail(session.accessToken, vendorId);
  if (!vendor) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isApproved = vendor.status === "approved";
  const requestedTab = parseTab(firstParam(resolvedSearchParams.tab));
  const activeTab =
    !isApproved && (requestedTab === "stock" || requestedTab === "orders") ? "data" : requestedTab;

  const stockFilters = {
    filter: parseStockFilter(firstParam(resolvedSearchParams.stockFilter)),
    page: Math.max(1, Number.parseInt(firstParam(resolvedSearchParams.stockPage) ?? "", 10) || 1),
    search: firstParam(resolvedSearchParams.stockSearch)?.trim() ?? "",
  };
  const orderFilters = {
    page: Math.max(1, Number.parseInt(firstParam(resolvedSearchParams.orderPage) ?? "", 10) || 1),
    search: firstParam(resolvedSearchParams.orderSearch)?.trim() ?? "",
    status: parseVendorOrderStatus(firstParam(resolvedSearchParams.orderStatus)),
  };
  const origin = {
    page: Math.max(1, Number.parseInt(firstParam(resolvedSearchParams.originPage) ?? "", 10) || 1),
    search: firstParam(resolvedSearchParams.originSearch)?.trim() ?? "",
    status: firstParam(resolvedSearchParams.originStatus)?.trim() || "pending",
  };

  const stockSnapshot =
    isApproved && activeTab === "stock"
      ? await getAdminVendorStock(session.accessToken, vendorId, {
          filter: stockFilters.filter,
          page: stockFilters.page,
          perPage: 50,
          search: stockFilters.search,
        })
      : null;

  const ordersSnapshot =
    isApproved && activeTab === "orders"
      ? await getAdminVendorOrders(session.accessToken, vendorId, {
          page: orderFilters.page,
          perPage: 20,
          search: orderFilters.search,
          status: orderFilters.status,
        })
      : null;

  return (
    <VendorDetailPage
      activeTab={activeTab}
      orderFilters={orderFilters}
      ordersSnapshot={ordersSnapshot}
      origin={origin}
      stockFilters={stockFilters}
      stockSnapshot={stockSnapshot}
      vendor={vendor}
    />
  );
}
