import {
  ActiveVendorSection,
  ProfileAccountSection,
  ProfileNotificationsSection,
} from "@/components/layout/profile-page";
import { NoCepNotice } from "@/components/active-vendor";
import { AnchoredSection, AnchoredSectionNav } from "@/components/ui/anchored-sections";
import { getAvailableVendors } from "@/features/active-vendor/server";

const SECTIONS = [
  { id: "vendor", label: "Vendor" },
  { id: "notificacoes", label: "Notificações" },
  { id: "conta", label: "Conta" },
] as const;

export default async function ProfileSettingsPage() {
  const availableVendorsResult = await getAvailableVendors();
  const missingCep =
    !availableVendorsResult.ok && availableVendorsResult.error.reason === "missing_cep";

  return (
    <div className="flex flex-col gap-5">
      <AnchoredSectionNav className="top-0" sections={SECTIONS} />

      <AnchoredSection
        description={
          missingCep
            ? "Sem um CEP na sua conta não dá para saber qual vendor atende você."
            : "O vendor escolhido atende seu CEP e define quais produtos aparecem no catálogo. Trocar de vendor pode alterar o frete e esvazia o carrinho."
        }
        display="brand"
        id="vendor"
        title="Vendor preferido"
      >
        {availableVendorsResult.ok ? (
          <ActiveVendorSection vendors={availableVendorsResult.vendors} />
        ) : missingCep ? (
          <NoCepNotice />
        ) : (
          <ActiveVendorSection error={availableVendorsResult.error} />
        )}
      </AnchoredSection>

      <ProfileNotificationsSection />
      <ProfileAccountSection />
    </div>
  );
}
