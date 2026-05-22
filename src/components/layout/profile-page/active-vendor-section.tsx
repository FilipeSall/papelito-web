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

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-black uppercase tracking-tight text-brand-dark">
          Vendor preferido
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-text-tertiary">
          O vendor selecionado abaixo atende seu CEP e define quais produtos aparecem no catálogo.
          Trocar de vendor pode alterar o frete dos produtos e esvazia o carrinho.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {error.message}
        </div>
      ) : null}

      {!error ? (
        <VendorPickerList
          vendors={pickerVendors}
          emptyMessage="Nenhum vendor atende seu CEP no momento."
        />
      ) : null}
    </section>
  );
}
