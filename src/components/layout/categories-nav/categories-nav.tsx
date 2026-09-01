import { CategoryNavItem } from "./category-nav-item";
import { CATEGORIES_NAV_ITEMS, resolveCategoryNavSubtitle } from "./constants";
import type { ProductsCollectionsSummary } from "@/features/catalog";

interface CategoriesNavProps {
  collectionsSummary?: ProductsCollectionsSummary | null;
}

const TILTS = [-1.4, 0.9, -0.7, 1.2];

export function CategoriesNav({ collectionsSummary }: Readonly<CategoriesNavProps>) {
  const items = CATEGORIES_NAV_ITEMS.map((item, index) => ({
    href: item.href,
    subtitle: resolveCategoryNavSubtitle(item, collectionsSummary),
    tilt: TILTS[index % TILTS.length],
    title: item.title,
  }));

  return (
    <section
      aria-labelledby="corredor-colecoes"
      className="w-full bg-transparent py-12 sm:py-16"
    >
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="flex flex-col items-center gap-8">
          <h2
            className="flex items-center gap-3 text-xl font-black uppercase leading-none tracking-[-0.02em] text-brand-dark sm:text-2xl"
            id="corredor-colecoes"
          >
            <span aria-hidden className="inline-block size-3 rotate-45 bg-brand-yellow" />
            Explore por coleção
          </h2>

          <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {items.map((item) => (
              <li key={item.title}>
                <CategoryNavItem {...item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
