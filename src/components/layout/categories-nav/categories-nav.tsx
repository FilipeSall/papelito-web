import { CategoryNavItem } from "./category-nav-item";
import { CATEGORIES_NAV_ITEMS } from "./constants";

/**
 * Barra de navegação por categoria exibida abaixo da barra de benefícios.
 *
 * Apresenta quatro cards clicáveis — Kits, Premium, Promoções e Novidades —
 * em layout horizontal com gap uniforme e sombra aplicada ao conjunto.
 */
export function CategoriesNav() {
  return (
    <section className="w-full bg-white h-44 pt-8">
      <div className="max-w-450 mx-auto px-43.5 flex flex-row justify-center items-center gap-12 h-full filter-[drop-shadow(0px_4px_4px_rgba(0,0,0,0.25))]">
        {CATEGORIES_NAV_ITEMS.map((item) => (
          <CategoryNavItem
            key={item.title}
            emoji={item.emoji}
            title={item.title}
            subtitle={item.subtitle}
            href={item.href}
          />
        ))}
      </div>
    </section>
  );
}
