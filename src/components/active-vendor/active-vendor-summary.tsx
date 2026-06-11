import Link from "next/link";
import { ArrowRightLeft, MapPin, Truck } from "lucide-react";

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
    <div className="flex flex-col gap-3 rounded-2xl border border-brand-yellow/40 bg-[#FFFBEB] px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
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
        <div className="flex w-full justify-center sm:w-auto">
          <Link
            href={changeHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand-dark px-4 py-2 text-center text-xs font-black uppercase tracking-wide text-brand-yellow transition hover:opacity-90 max-[319px]:w-full max-[319px]:rounded-2xl max-[319px]:border max-[319px]:border-brand-dark/12 max-[319px]:bg-brand-yellow max-[319px]:px-3 max-[319px]:py-3 max-[319px]:text-[11px] max-[319px]:tracking-[0.12em] max-[319px]:text-brand-dark"
          >
            <span className="hidden items-center gap-2 max-[319px]:inline-flex">
              <ArrowRightLeft aria-hidden className="h-3.5 w-3.5" />
              <span>Trocar revendedor</span>
            </span>
            <span className="max-[319px]:hidden">{changeLabel}</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
