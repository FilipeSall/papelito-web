import type { RevendedorApplication, RevendedorFormValues } from "@/features/revendedor";
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
  initialValues?: Partial<RevendedorFormValues>;
  isAuthenticated: boolean;
};

export function RevendedorPage({
  application,
  images,
  initialValues,
  isAuthenticated,
}: RevendedorPageProps) {
  return (
    <main className="bg-white">
      <RevendedorHeroSection
        application={application}
        initialValues={initialValues}
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
