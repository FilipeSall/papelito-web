import type {
  RevendedorApplication,
  VendorRegistrationDraft,
} from "@/features/revendedor";
import type { SiteImageAssets } from "@/types/home-assets";

import { RevendedorBenefitsSection } from "./organisms/revendedor-benefits-section";
import { RevendedorBusinessTypesSection } from "./organisms/revendedor-business-types-section";
import { RevendedorHeroSection } from "./organisms/revendedor-hero-section";
import { RevendedorTestimonialsSection } from "./organisms/revendedor-testimonials-section";

/**
 * Compoe a landing pública do programa de revendedores a partir dos blocos da página.
 */
type RevendedorPageProps = {
  application: RevendedorApplication;
  images?: SiteImageAssets;
  initialDraft: VendorRegistrationDraft;
  isAuthenticated: boolean;
};

export function RevendedorPage({
  application,
  images,
  initialDraft,
  isAuthenticated,
}: RevendedorPageProps) {
  return (
    <main className="bg-white">
      <RevendedorHeroSection
        application={application}
        initialDraft={initialDraft}
        isAuthenticated={isAuthenticated}
      />
      <RevendedorBenefitsSection />
      <RevendedorBusinessTypesSection
        illustrationImage={images?.revendedorBusinessIllustration}
        mainImage={images?.revendedorBusinessMain}
        secondaryImage={images?.revendedorBusinessSecondary}
      />
      <RevendedorTestimonialsSection />
    </main>
  );
}
