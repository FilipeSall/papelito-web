"use client";

import { MapPin, Truck, Boxes } from "lucide-react";

import {
  formatDistanceKm,
  formatLeadTime,
  formatVendorRegion,
} from "@/features/active-vendor";

import { VendorStockBadge } from "./vendor-stock-badge";

export interface VendorOptionCardVendor {
  vendorId: number;
  storeName: string;
  city: string;
  state: string;
  distanceKm: number | null;
  leadTimeDays: number;
  qty?: number;
  productsInStock?: number;
}

interface VendorOptionCardProps {
  vendor: VendorOptionCardVendor;
  isActive: boolean;
  isNearest: boolean;
  onSelect: (vendorId: number) => void;
  selecting?: boolean;
  disabledReason?: string | null;
}

export function VendorOptionCard({
  vendor,
  isActive,
  isNearest,
  onSelect,
  selecting = false,
  disabledReason = null,
}: VendorOptionCardProps) {
  const region = formatVendorRegion(vendor.city, vendor.state);
  const distance = formatDistanceKm(vendor.distanceKm);
  const leadTime = formatLeadTime(vendor.leadTimeDays);
  const disabled = isActive || Boolean(disabledReason) || selecting;

  return (
    <article
      className={`flex h-full flex-col gap-3 rounded-2xl border bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition ${
        isActive
          ? "border-brand-yellow ring-2 ring-brand-yellow/40"
          : "border-[#E5E7EB] hover:border-brand-dark/30"
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-tight text-brand-dark">
            {vendor.storeName || `Vendor #${vendor.vendorId}`}
          </p>
          {region ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-text-tertiary">
              <MapPin aria-hidden className="h-3.5 w-3.5" />
              {region}
              {distance ? <span className="opacity-70">· {distance}</span> : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          {isActive ? (
            <span className="rounded-full bg-brand-dark px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-brand-yellow">
              Atual
            </span>
          ) : null}
          {isNearest && !isActive ? (
            <span className="rounded-full border border-brand-dark/20 bg-bg-light px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-brand-dark/80">
              Mais próximo
            </span>
          ) : null}
        </div>
      </header>

      <dl className="grid gap-2 text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <Truck aria-hidden className="h-3.5 w-3.5 text-brand-dark/70" />
          <span>{leadTime}</span>
        </div>
        {typeof vendor.qty === "number" ? (
          <div className="flex items-center gap-2">
            <Boxes aria-hidden className="h-3.5 w-3.5 text-brand-dark/70" />
            <VendorStockBadge qty={vendor.qty} />
          </div>
        ) : typeof vendor.productsInStock === "number" ? (
          <div className="flex items-center gap-2">
            <Boxes aria-hidden className="h-3.5 w-3.5 text-brand-dark/70" />
            <span>
              {vendor.productsInStock > 0
                ? `${vendor.productsInStock} produtos em estoque`
                : "Sem produtos em estoque"}
            </span>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto pt-2">
        {disabledReason && !isActive ? (
          <p className="mb-2 text-xs text-red-600">{disabledReason}</p>
        ) : null}
        <button
          type="button"
          onClick={() => onSelect(vendor.vendorId)}
          disabled={disabled}
          className={`w-full rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
            isActive
              ? "cursor-default bg-brand-yellow/30 text-brand-dark"
              : "cursor-pointer bg-brand-dark text-brand-yellow hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          }`}
        >
          {isActive ? "Selecionado" : selecting ? "Trocando..." : "Selecionar este vendor"}
        </button>
      </div>
    </article>
  );
}
