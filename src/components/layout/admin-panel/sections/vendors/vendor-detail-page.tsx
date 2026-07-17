import Link from "next/link";

import type {
  AdminVendorOrdersSnapshot,
  AdminVendorStockSnapshot,
} from "@/lib/server/admin-vendor-operations";
import type { AdminVendorDetail } from "@/lib/server/admin-vendors";

import { VendorBankingTab } from "./vendor-banking-tab";
import { VendorCoverageTab } from "./vendor-coverage-tab";
import { VendorDataTab } from "./vendor-data-tab";
import {
  type DetailTabKey,
  type OrderFilters,
  type OriginFilters,
  type StockFilters,
  type VendorDetailContext,
  vendorBackHref,
  vendorDetailHref,
} from "./vendor-detail-context";
import { formatVendorDateTime } from "./vendor-detail-format";
import { VendorDetailTabs } from "./vendor-detail-tabs";
import { VendorOrdersTab } from "./vendor-orders-tab";
import { VendorStockTab } from "./vendor-stock-tab";

export function VendorDetailPage({
  activeTab,
  orderFilters,
  ordersSnapshot,
  origin,
  stockFilters,
  stockSnapshot,
  vendor,
}: {
  activeTab: DetailTabKey;
  orderFilters: OrderFilters;
  ordersSnapshot: AdminVendorOrdersSnapshot | null;
  origin: OriginFilters;
  stockFilters: StockFilters;
  stockSnapshot: AdminVendorStockSnapshot | null;
  vendor: AdminVendorDetail;
}) {
  const fullName = `${vendor.firstName} ${vendor.lastName}`.trim() || vendor.name;
  const ctx: VendorDetailContext = {
    activeTab,
    orderFilters,
    origin,
    stockFilters,
    vendorId: vendor.id,
  };
  const tabs: Array<{ href: string; key: DetailTabKey; label: string }> = [
    { href: vendorDetailHref(ctx, { tab: "data" }), key: "data", label: "Dados" },
    { href: vendorDetailHref(ctx, { tab: "coverage" }), key: "coverage", label: "Cobertura" },
    { href: vendorDetailHref(ctx, { tab: "banking" }), key: "banking", label: "Dados bancários" },
    { href: vendorDetailHref(ctx, { tab: "stock" }), key: "stock", label: "Estoque" },
    { href: vendorDetailHref(ctx, { tab: "orders" }), key: "orders", label: "Pedidos atendidos" },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Link
          className="inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[#231f20]/62 underline"
          href={vendorBackHref(origin)}
        >
          Voltar para vendors
        </Link>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
          Vendor #{vendor.id}
        </p>
        <div>
          <h1
            className="text-3xl font-semibold leading-tight text-[#231f20]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            {vendor.storeName || fullName || vendor.email || `Vendor #${vendor.id}`}
          </h1>
          <p className="mt-2 text-sm text-[#231f20]/64">
            Conta vendor desde {formatVendorDateTime(vendor.registeredAt)}
          </p>
        </div>
      </div>

      <VendorDetailTabs activeTab={activeTab} tabs={tabs} />
      {activeTab === "data" ? <VendorDataTab vendor={vendor} /> : null}
      {activeTab === "coverage" ? <VendorCoverageTab vendor={vendor} /> : null}
      {activeTab === "banking" ? <VendorBankingTab vendor={vendor} /> : null}
      {activeTab === "stock" ? <VendorStockTab ctx={ctx} snapshot={stockSnapshot} /> : null}
      {activeTab === "orders" ? <VendorOrdersTab ctx={ctx} snapshot={ordersSnapshot} /> : null}

      <div className="text-xs text-[#231f20]/46">
        <Link className="underline" href={vendorDetailHref(ctx)}>Atualizar esta visão</Link>
      </div>
    </div>
  );
}

