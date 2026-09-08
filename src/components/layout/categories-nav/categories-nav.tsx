import { CategoryNavItem } from "./category-nav-item";
import { isCategoryNavItemVisible, resolveCategoryNavSubtitle } from "./constants";
import { COLLECTION_NAV_TILTS } from "@/lib/home-collections-nav";
import type { ProductsCollectionsSummary } from "@/features/catalog";
import type { CollectionNavItem } from "@/types/home-assets";

interface CategoriesNavProps {
  items: readonly CollectionNavItem[];
  collectionsSummary?: ProductsCollectionsSummary | null;
}

export function CategoriesNav({
  items: configuredItems,
  collectionsSummary,
}: Readonly<CategoriesNavProps>) {
  const items = configuredItems
    .filter((item) => isCategoryNavItemVisible(item, collectionsSummary))
    .map((item, index) => ({
      href: item.href,
      id: item.id,
      subtitle: resolveCategoryNavSubtitle(item, collectionsSummary),
      tilt: COLLECTION_NAV_TILTS[index % COLLECTION_NAV_TILTS.length],
      title: item.title,
    }));

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="corredor-colecoes"
      className="w-full bg-transparent py-12 sm:py-16"
    >
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="flex flex-col items-center gap-8">
          <h2
            className="flex items-center gap-3 text-xl font-black uppercase leading-none tracking-tight text-brand-dark sm:text-2xl"
            id="corredor-colecoes"
          >
            <span aria-hidden className="inline-block size-3 rounded-full bg-brand-yellow" />
            Explore por coleção
          </h2>

          <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {items.map(({ id, ...item }) => (
              <li key={id}>
                <CategoryNavItem {...item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
