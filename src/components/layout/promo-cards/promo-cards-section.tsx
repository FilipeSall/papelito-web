import { PromoCard } from "./promo-card";

/**
 * Par de cartazes colados no fim do corredor: o material de PDV e o kit de
 * revendedor iniciante, os dois apontando para `/revendedor`.
 */
export function PromoCardsSection() {
  return (
    <section className="w-full py-12 sm:py-14">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="mx-auto grid w-full max-w-304 grid-cols-1 gap-6 lg:grid-cols-2">
          <PromoCard
            href="/revendedor"
            image="/images/promo/mobile-livreto-premium.png"
            imageAlt="Materiais de merchandising Papelito"
            linkText="Seja PDV Perfeito"
            title={"MATERIAIS\nEXCLUSIVOS\nDE MERCHANDISING"}
            variant="dark"
          />

          <PromoCard
            discountBadge="20%"
            href="/revendedor"
            image="/images/promo/caixa-revendedor.png"
            imageAlt="Kit revendedor iniciante Papelito"
            label="Kit completo"
            linkText="Eu quero!"
            title={"REVENDEDOR\nINICIANTE"}
            variant="yellow"
          />
        </div>
      </div>
    </section>
  );
}
