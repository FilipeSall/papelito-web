import { VendorPickerList, type VendorPickerOption } from "@/components/active-vendor";
import type { ActiveVendorError, AvailableVendor } from "@/features/active-vendor";

interface ActiveVendorSectionProps {
  vendors?: AvailableVendor[];
  error?: ActiveVendorError | null;
}

export function ActiveVendorSection({ vendors = [], error = null }: ActiveVendorSectionProps) {
  const pickerVendors: VendorPickerOption[] = vendors.map((vendor) => ({
    vendorId: vendor.vendorId,
    storeName: vendor.storeName,
    city: vendor.city,
    state: vendor.state,
    distanceKm: vendor.distanceKm,
    leadTimeDays: vendor.leadTimeDays,
    productsInStock: vendor.productsInStock,
    isActive: vendor.isActive,
    isNearest: vendor.isNearest,
  }));

  if (error) {
    return (
      <div
        className="border-2 border-[#c0392b] bg-[#f7e6e2] px-4 py-3 text-sm leading-6 font-semibold text-[#7a3428]"
        role="alert"
      >
        {error.message}
      </div>
    );
  }

  return (
    <VendorPickerList
      emptyMessage="Nenhum vendor atende seu CEP no momento."
      vendors={pickerVendors}
    />
  );
}
