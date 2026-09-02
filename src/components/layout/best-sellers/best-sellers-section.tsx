import Link from "next/link";
import { SectionHeader, ArrowRightIcon } from "@/components/ui";
import { ProductCard } from "../flash-sale/product-card";
import type { HomeProductCard } from "@/features/catalog";

interface BestSellersSectionProps {
  products: HomeProductCard[];
}

export function BestSellersSection({ products }: BestSellersSectionProps) {
  return (
    <section className="w-full bg-white py-14">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="w-full max-w-304 mx-auto flex flex-col gap-8">
          <SectionHeader
            emoji="🔥"
            label="Mais Vendidos"
            title={"NOSSOS\nPRODUTOS"}
          />

          <div className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 bg-brand-dark text-white px-8 py-4 rounded-full hover:opacity-80 transition-opacity"
            >
              <span className="font-black text-base leading-6 tracking-[-0.3125px] uppercase">
                Ver todos os produtos
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
