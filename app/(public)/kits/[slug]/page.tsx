import { notFound } from "next/navigation";

import {
  AddToCartButton,
  ImageWithSkeleton,
  ProductImageFallback,
} from "@/components/ui";
import { getKitsCatalog } from "@/features/catalog/services/get-kits-catalog";

export const revalidate = 60;

export default async function KitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kit = (await getKitsCatalog()).find(
    (item) => item.href === `/kits/${slug}`,
  );

  if (!kit) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 md:px-12">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square border-2 border-[#1a1a1a] bg-[#faf8f2] p-6 shadow-[8px_8px_0_#1a1a1a]">
          {kit.image ? (
            <ImageWithSkeleton
              alt={kit.name}
              fallback={<ProductImageFallback className="size-full" />}
              fill
              imageClassName="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 50vw"
              src={kit.image}
            />
          ) : (
            <ProductImageFallback className="size-full" />
          )}
        </div>
        <div className="self-center">
          <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#6f6758]">
            Kit Papelito
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase text-[#231f20]">
            {kit.name}
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#5e574c]">
            Produtos selecionados para comprar juntos, com preço próprio.
          </p>
          <div className="mt-7">
            <p className="text-3xl font-black text-[#231f20]">
              R$ {kit.price.toFixed(2).replace(".", ",")}
            </p>
            {kit.originalPrice > kit.price ? (
              <p className="mt-1 text-sm text-[#6f6758] line-through">
                R$ {kit.originalPrice.toFixed(2).replace(".", ",")}
              </p>
            ) : null}
          </div>
          <AddToCartButton
            className="mt-7 h-12 px-5"
            label="Adicionar ao carrinho"
            product={{
              id: kit.id,
              category: kit.category,
              image: kit.image,
              name: kit.name,
              originalPrice: kit.originalPrice,
              price: kit.price,
            }}
          />
        </div>
      </div>
    </main>
  );
}
