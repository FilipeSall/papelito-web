import Link from "next/link";
import type { ProductDetailItem } from "@/features/catalog";
import { ProductDetailMainContent } from "./product-detail-main-content";

interface ProductDetailMainSectionProps {
  /** Produto carregado para a seção principal da PDP. */
  product: ProductDetailItem;
  initialIsFavorite?: boolean;
}

/**
 * Seção principal abaixo do breadcrumb da página de produto.
 *
 * Define fundo, largura máxima e espaçamento vertical da área.
 */
export function ProductDetailMainSection({
  product,
  initialIsFavorite = false,
}: ProductDetailMainSectionProps) {
  return (
    <section className="w-full bg-[#F9FAFB] pb-18">
      <div className="relative mx-auto w-full max-w-271 px-4 md:px-8">
        <Link
          href="/produtos"
          className="relative mt-10 inline-flex h-5 items-center gap-2 text-sm leading-none text-[#99A1AF] transition hover:opacity-80"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            className="block shrink-0"
          >
            <path
              d="M10 4L6 8L10 12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="block leading-none">Voltar</span>
        </Link>

        <div className="mt-6 md:mt-7">
          <ProductDetailMainContent
            product={product}
            initialIsFavorite={initialIsFavorite}
          />
        </div>
      </div>
    </section>
  );
}
