import { PromoCard } from "./promo-card";

/**
 * Seção de cards promocionais lado a lado.
 *
 * Organismo que exibe dois cards promocionais em grid 2 colunas:
 * - **Card escuro (esquerda)**: Materiais exclusivos de merchandising para PDV
 * - **Card amarelo (direita)**: Kit completo para revendedor iniciante com badge de desconto
 *
 * Utiliza o componente molecular `PromoCard` com duas variantes visuais.
 * As imagens são carregadas via Next.js Image para otimização automática.
 *
 * @example
 * ```tsx
 * <PromoCardsSection />
 * ```
 */
export function PromoCardsSection() {
  return (
    <section className="w-full bg-bg-light py-5">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="mx-auto grid w-full max-w-304 grid-cols-1 gap-5 lg:grid-cols-2">
          {/* TODO: Substituir por requisição ao backend — GET /api/promotions/cards
              Conteúdo dos cards promocionais (título, imagem, link, badge) deve vir do CMS/backend. */}
          {/* Dark card - PDV Materials */}
          <PromoCard
            variant="dark"
            title={"MATERIAIS\nEXCLUSIVOS\nDE MERCHAN"}
            linkText={"SEJA PDV\nPERFEITO"}
            href="/pdv"
            image="/images/promo/mobile-livreto-premium.png"
            imageAlt="Materiais de merchandising Papelito"
          />

          {/* Yellow card - Reseller Kit */}
          <PromoCard
            variant="yellow"
            label="🎁 Kit Completo"
            title={"REVENDEDOR\nINICIANTE"}
            linkText="EU QUERO!"
            href="/revendedor"
            image="/images/promo/caixa-revendedor.png"
            imageAlt="Kit revendedor iniciante Papelito"
            discountBadge="20%"
          />
        </div>
      </div>
    </section>
  );
}
