import { RevendedorBenefitsSection } from "./organisms/revendedor-benefits-section";
import { RevendedorBusinessTypesSection } from "./organisms/revendedor-business-types-section";
import { RevendedorHeroSection } from "./organisms/revendedor-hero-section";
import { RevendedorTestimonialsSection } from "./organisms/revendedor-testimonials-section";

/**
 * Compoe a landing pública do programa de revendedores a partir dos blocos da página.
 */
export function RevendedorPage() {
  return (
    <main className="bg-white">
      <RevendedorHeroSection />
      <RevendedorBenefitsSection />
      <RevendedorBusinessTypesSection />
      <RevendedorTestimonialsSection />
    </main>
  );
}
