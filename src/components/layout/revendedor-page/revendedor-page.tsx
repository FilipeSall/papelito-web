import type { SiteImageAssets } from "@/types/home-assets";

import { RevendedorBenefitsSection } from "./organisms/revendedor-benefits-section";
import { RevendedorBusinessTypesSection } from "./organisms/revendedor-business-types-section";
import { RevendedorHeroSection } from "./organisms/revendedor-hero-section";
import { RevendedorTestimonialsSection } from "./organisms/revendedor-testimonials-section";

/**
 * Compoe a landing pública do programa de revendedores a partir dos blocos da página.
 */
type RevendedorPageProps = {
  images?: SiteImageAssets;
};

export function RevendedorPage({ images }: Readonly<RevendedorPageProps>) {
  return (
    <main className="bg-white">
      <RevendedorHeroSection />
      <RevendedorBenefitsSection />
      <RevendedorBusinessTypesSection
        mainImage={images?.revendedorBusinessMain}
        secondaryImage={images?.revendedorBusinessSecondary}
      />
      <RevendedorTestimonialsSection />
    </main>
  );
}
