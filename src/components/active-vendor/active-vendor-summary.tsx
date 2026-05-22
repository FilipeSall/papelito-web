import Link from "next/link";
import { MapPin, Truck } from "lucide-react";

import {
  formatDistanceKm,
  formatLeadTime,
  formatVendorRegion,
  type ActiveVendor,
} from "@/features/active-vendor";

interface ActiveVendorSummaryProps {
  vendor: ActiveVendor;
  changeHref?: string;
  changeLabel?: string;
}

export function ActiveVendorSummary({
  vendor,
  changeHref,
  changeLabel = "Trocar vendor",
}: ActiveVendorSummaryProps) {
  const region = formatVendorRegion(vendor.city, vendor.state);
  const distance = formatDistanceKm(vendor.distanceKm);
  const leadTime = formatLeadTime(vendor.leadTimeDays);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-brand-yellow/40 bg-[#FFFBEB] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.6px] text-brand-dark/70">
          Vendor selecionado
        </p>
        <p className="mt-0.5 text-sm font-black text-brand-dark">{vendor.storeName}</p>
        <ul className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
          {region ? (
            <li className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="h-3.5 w-3.5" />
              <span>{region}</span>
              {distance ? <span className="opacity-70">· {distance}</span> : null}
            </li>
          ) : null}
          <li className="inline-flex items-center gap-1">
            <Truck aria-hidden className="h-3.5 w-3.5" />
            <span>{leadTime}</span>
          </li>
        </ul>
      </div>
      {changeHref ? (
        <Link
          href={changeHref}
          className="shrink-0 rounded-full bg-brand-dark px-3 py-1.5 text-xs font-black uppercase tracking-wide text-brand-yellow transition hover:opacity-90"
        >
          {changeLabel}
        </Link>
      ) : null}
    </div>
  );
}
