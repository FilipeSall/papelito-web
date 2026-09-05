import type { VendorRegistrationStep1Data } from "@/features/revendedor";
import type { VendorInterest } from "@/features/revendedor/types/vendor-interest";
import type { SiteImageAssets } from "@/types/home-assets";

import { RevendedorBenefitsSection } from "./organisms/revendedor-benefits-section";
import { RevendedorBusinessTypesSection } from "./organisms/revendedor-business-types-section";
import { RevendedorHeroSection } from "./organisms/revendedor-hero-section";
import { RevendedorTestimonialsSection } from "./organisms/revendedor-testimonials-section";

/**
 * Compoe a landing pública do programa de revendedores a partir dos blocos da página.
 */
type RevendedorPageProps = {
  interest: VendorInterest | null;
  images?: SiteImageAssets;
  initialValues: VendorRegistrationStep1Data;
  isAuthenticated: boolean;
  role?: string;
};

export function RevendedorPage({
  interest,
  images,
  initialValues,
  isAuthenticated,
  role,
}: RevendedorPageProps) {
  return (
    <main className="bg-white">
      <RevendedorHeroSection
        interest={interest}
        initialValues={initialValues}
        isAuthenticated={isAuthenticated}
        role={role}
      />
      <RevendedorBenefitsSection />
      <RevendedorBusinessTypesSection
        mainImage={images?.revendedorBusinessMain}
        secondaryImage={images?.revendedorBusinessSecondary}
      />
      <RevendedorTestimonialsSection />
    </main>
  );
}
