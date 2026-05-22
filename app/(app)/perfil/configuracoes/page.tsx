import { ActiveVendorSection, ProfileSettings } from "@/components/layout/profile-page";
import { NoCepNotice } from "@/components/active-vendor";
import { getAvailableVendors } from "@/features/active-vendor/server";

export default async function ProfileSettingsPage() {
  const availableVendorsResult = await getAvailableVendors();

  return (
    <div className="flex flex-col gap-10">
      {availableVendorsResult.ok ? (
        <ActiveVendorSection vendors={availableVendorsResult.vendors} />
      ) : availableVendorsResult.error.reason === "missing_cep" ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black uppercase tracking-tight text-brand-dark">
              Vendor preferido
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-text-tertiary">
              Cadastre um CEP nos seus endereços para escolher o vendor que atende sua região.
            </p>
          </div>
          <NoCepNotice />
        </section>
      ) : (
        <ActiveVendorSection error={availableVendorsResult.error} />
      )}

      <ProfileSettings />
    </div>
  );
}
