import Link from "next/link";

import type {
  AdminVendorOrdersSnapshot,
  AdminVendorStockSnapshot,
} from "@/lib/server/admin-vendor-operations";
import type { AdminVendorDetail } from "@/lib/server/admin-vendors";

import { Panel } from "../../primitives";

import { VendorActions } from "./vendor-actions";
import { VendorBankingTab } from "./vendor-banking-tab";
import { VendorCoverageTab } from "./vendor-coverage-tab";
import { VendorDataTab } from "./vendor-data-tab";
import {
  type OrderFilters,
  type OriginFilters,
  type StockFilters,
  type DetailTabKey,
  type VendorDetailContext,
  vendorBackHref,
  vendorDetailHref,
} from "./vendor-detail-context";
import { formatVendorDateTime } from "./vendor-detail-format";
import { VendorDetailTabs } from "./vendor-detail-tabs";
import { VendorOrdersTab } from "./vendor-orders-tab";
import { VendorStatusBadge } from "./vendor-status";
import { VendorStockTab } from "./vendor-stock-tab";

function normalizeStatus(value: string): "pending" | "incomplete" | "approved" | "rejected" | "none" {
  if (
    value === "pending" ||
    value === "incomplete" ||
    value === "approved" ||
    value === "rejected"
  ) {
    return value;
  }
  return "none";
}

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
  const status = normalizeStatus(vendor.status);
  const isApproved = status === "approved";
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
    { href: vendorDetailHref(ctx, { tab: "banking" }), key: "banking", label: "Dados bancarios" },
    ...(isApproved
      ? ([
          { href: vendorDetailHref(ctx, { tab: "stock" }), key: "stock", label: "Estoque" },
          {
            href: vendorDetailHref(ctx, { tab: "orders" }),
            key: "orders",
            label: "Pedidos atendidos",
          },
        ] as Array<{ href: string; key: DetailTabKey; label: string }>)
      : []),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Link
            href={vendorBackHref(origin)}
            className="inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[#231f20]/62 underline"
          >
            Voltar para vendors
          </Link>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              Vendor #{vendor.id}
            </p>
            <VendorStatusBadge status={status} />
          </div>
          <div>
            <h1
              className="text-3xl font-semibold leading-tight text-[#231f20]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              {vendor.storeName || fullName || vendor.email || `Vendor #${vendor.id}`}
            </h1>
            <p className="mt-2 text-sm text-[#231f20]/64">
              Solicitacao recebida em {formatVendorDateTime(vendor.submittedAt || vendor.registeredAt)}
            </p>
          </div>
        </div>
      </div>

      <VendorDetailTabs activeTab={activeTab} tabs={tabs} />

      {activeTab === "data" ? <VendorDataTab status={status} vendor={vendor} /> : null}
      {activeTab === "coverage" ? <VendorCoverageTab vendor={vendor} /> : null}
      {activeTab === "banking" ? <VendorBankingTab vendor={vendor} /> : null}
      {activeTab === "stock" && isApproved ? (
        <VendorStockTab ctx={ctx} snapshot={stockSnapshot} />
      ) : null}
      {activeTab === "orders" && isApproved ? (
        <VendorOrdersTab ctx={ctx} snapshot={ordersSnapshot} />
      ) : null}

      <Panel className="p-5 md:p-6">
        <VendorActions
          email={vendor.email}
          firstName={vendor.firstName}
          status={vendor.status}
          storeName={vendor.storeName}
          vendorId={vendor.id}
        />
      </Panel>

      <div className="text-xs text-[#231f20]/46">
        <Link href={vendorDetailHref(ctx)} className="underline">
          Atualizar esta visao
        </Link>
      </div>
    </div>
  );
}
