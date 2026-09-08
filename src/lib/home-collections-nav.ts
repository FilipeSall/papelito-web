import type { CollectionNavItem } from "@/types/home-assets";

/**
 * Inclinação de cada chip, por posição na fila.
 *
 * Fica no código, não no banco: é recorte da marca, não conteúdo editorial. Persistir grau por
 * card só daria ao admin uma forma de desalinhar a fila. A prévia do painel usa a mesma lista.
 */
export const COLLECTION_NAV_TILTS = [-1.4, 0.9, -0.7, 1.2];

/**
 * Corredor publicado quando o WordPress não responde.
 *
 * Espelha `papelito_home_assets_default_collections_nav_items()`: é a mesma lista que o plugin
 * semeia, para que a Home degrade para o corredor de sempre em vez de perder a seção.
 *
 * Mora em `lib/` pelo mesmo motivo de `site-logos.ts`: é consumido pelo serviço da vitrine e pelos
 * componentes, e um serviço não deve depender da camada de composição visual para ter um fallback.
 */
export const COLLECTION_NAV_DEFAULTS: readonly CollectionNavItem[] = [
  {
    id: "kits",
    title: "Kits",
    subtitle: "Kits exclusivos",
    href: "/kits",
    collection: "kits",
    order: 1,
    isActive: true,
  },
  {
    id: "premium",
    title: "Premium",
    subtitle: "Top sellers",
    href: "/premium",
    collection: "",
    order: 2,
    isActive: true,
  },
  {
    id: "promocoes",
    title: "Promoções",
    subtitle: "Ofertas disponíveis",
    href: "/promocoes",
    collection: "promocoes",
    order: 3,
    isActive: true,
  },
  {
    id: "novidades",
    title: "Novidades",
    subtitle: "Recém chegados",
    href: "/novidades",
    collection: "",
    order: 4,
    isActive: true,
  },
];
