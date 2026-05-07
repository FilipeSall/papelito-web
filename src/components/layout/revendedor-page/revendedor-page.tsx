import type { RevendedorApplication, RevendedorFormValues } from "@/features/revendedor";

import { RevendedorBenefitsSection } from "./organisms/revendedor-benefits-section";
import { RevendedorBusinessTypesSection } from "./organisms/revendedor-business-types-section";
import { RevendedorHeroSection } from "./organisms/revendedor-hero-section";
import { RevendedorTestimonialsSection } from "./organisms/revendedor-testimonials-section";

/**
 * Compoe a landing pública do programa de revendedores a partir dos blocos da página.
 */
type RevendedorPageProps = {
  application: RevendedorApplication;
  initialValues?: Partial<RevendedorFormValues>;
  isAuthenticated: boolean;
};

export function RevendedorPage({
  application,
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
      <RevendedorBusinessTypesSection />
      <RevendedorTestimonialsSection />
    </main>
  );
}
