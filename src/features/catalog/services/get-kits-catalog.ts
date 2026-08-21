import "server-only";

import { wpRest } from "@/lib/server/wp-rest";
import type { ProductGridItem } from "@/components/layout/products-page";

type Kit = {
  productId?: number;
  name?: string;
  price?: string;
  salePrice?: string;
  imageUrl?: string;
  slug?: string;
};

export async function getKitsCatalog(): Promise<ProductGridItem[]> {
  const result = await wpRest<{ items?: Kit[] }>("/papelito/v1/kits", {
    revalidate: 60,
    tags: ["wp:kits"],
  });
  if (!result.ok || !Array.isArray(result.data.items)) return [];
  return result.data.items.flatMap((kit) => {
    const id = Number(kit.productId);
    const price = Number(kit.salePrice || kit.price || 0);
    const originalPrice = Number(kit.price || price);
    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !kit.name ||
      !Number.isFinite(price)
    )
      return [];
    return [
      {
        id: String(id),
        name: kit.name,
        category: "Kit",
        badge: "Kit Papelito",
        price,
        originalPrice,
        image: kit.imageUrl,
        href: kit.slug ? `/kits/${kit.slug}` : "/kits",
      },
    ];
  });
}
