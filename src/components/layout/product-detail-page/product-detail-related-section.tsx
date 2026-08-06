import Link from "next/link";
import { ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import type { ProductDetailRelatedThumb } from "@/features/catalog/types/product-detail";
import { formatBRL } from "@/lib/format-currency";

interface ProductDetailRelatedSectionProps {
  products: ProductDetailRelatedThumb[];
}

export function ProductDetailRelatedSection({
  products,
}: Readonly<ProductDetailRelatedSectionProps>) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-3xl font-black leading-8 uppercase text-brand-dark md:text-8">
        Produtos Relacionados
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((related) => (
          <Link
            key={related.id}
            href={`/produtos/${related.id}`}
            className="group overflow-hidden rounded-xl border border-[#E5E7EB] bg-white transition hover:border-[#D1D5DB] hover:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.08)]"
          >
            <div className="relative h-40 bg-[#F9FAFB] p-6">
              {related.image ? (
                <ImageWithSkeleton
                  src={related.image}
                  alt={related.name}
                  fill
                  sizes="240px"
                  imageClassName="object-contain"
                  fallback={<ProductImageFallback className="h-full w-full" />}
                />
              ) : (
                <ProductImageFallback className="h-full w-full" />
              )}
            </div>
            <div className="px-4 py-4">
              <p className="line-clamp-1 text-sm font-bold leading-5 tracking-[-0.150391px] text-brand-dark">
                {related.name}
              </p>
              <p className="mt-1 text-xl font-black leading-6 tracking-[-0.3125px] text-brand-dark">
                {formatBRL(related.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
