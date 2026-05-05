"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { ADD_TO_CART_EVENT_NAME } from "@/components/ui/add-to-cart-button";
import { ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import { CartIcon } from "@/components/ui/icons";
import { useCartStore } from "@/features/cart";
import type { ProductDetailItem } from "@/features/catalog";
import { formatBRL } from "@/lib/format-currency";

interface ProductDetailMainContentProps {
  /** Dados do produto atual para renderização da seção principal. */
  product: ProductDetailItem;
}

const EMPTY_GALLERY: ProductDetailItem["galleryImages"] = [];

function ProductRatingStars({ rating }: { rating: number }) {
  const filledCount = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => {
        const isFilled = index < filledCount;

        return (
          <svg
            key={index}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1.2L9.88 5.24L14.4 5.6L11.04 8.53L12.07 12.95L8 10.54L3.93 12.95L4.96 8.53L1.6 5.6L6.12 5.24L8 1.2Z"
              fill={isFilled ? "#FFE500" : "none"}
              stroke={isFilled ? "#FFE500" : "#D1D5DB"}
              strokeWidth="0.9"
            />
          </svg>
        );
      })}
    </div>
  );
}

/**
 * Conteúdo principal da página dedicada de produto.
 *
 * Controla estados interativos locais:
 * - seleção de miniatura
 * - quantidade para adicionar ao carrinho
 */
export function ProductDetailMainContent({ product }: ProductDetailMainContentProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { status } = useSession();
  const galleryImages = product.galleryImages ?? EMPTY_GALLERY;

  const thumbnails = useMemo(
    () =>
      (galleryImages.length > 0
        ? galleryImages
        : [{ id: `${product.id}:primary`, name: product.name, image: product.image }]).filter(
        (thumb) => Boolean(thumb.image?.trim()),
      ).slice(0, 4),
    [galleryImages, product.id, product.image, product.name],
  );
  const initialSelectedThumbId = useMemo(
    () => thumbnails[0]?.id ?? `${product.id}:primary`,
    [product.id, thumbnails],
  );

  const [selectedThumbId, setSelectedThumbId] = useState<string>(initialSelectedThumbId);
  const [quantity, setQuantity] = useState(1);

  const selectedThumb = useMemo(
    () => thumbnails.find((thumb) => thumb.id === selectedThumbId) ?? thumbnails[0],
    [selectedThumbId, thumbnails],
  );
  const relatedProducts = useMemo(() => product.relatedThumbs.slice(0, 4), [product.relatedThumbs]);
  const shouldShowThumbnails = thumbnails.length > 1;

  function addCurrentProductToCart() {
    if (status === "loading") return;

    if (status !== "authenticated") {
      router.push("/entrar");
      return false;
    }

    addItem(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
      },
      quantity,
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(ADD_TO_CART_EVENT_NAME, {
          detail: { productName: product.name },
        }),
      );
    }

    return true;
  }

  function handleAddToCart() {
    addCurrentProductToCart();
  }

  function handleBuyNow() {
    const added = addCurrentProductToCart();

    if (!added) {
      return;
    }

    router.push("/carrinho");
  }

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[486px_minmax(0,486px)] xl:gap-12">
        <div className="flex flex-col gap-4">
          <div className="relative h-80 w-full overflow-hidden rounded-3xl bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] sm:h-96 sm:p-10">
            {product.discountPercent > 0 ? (
              <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full bg-brand-yellow px-3 py-1 text-xs font-black leading-4 text-brand-dark">
                -{product.discountPercent}%
              </div>
            ) : null}
            <div className="pointer-events-none absolute right-5 top-5 z-10 rounded-full bg-[#231F20] px-3 py-1 text-xs font-black leading-4 text-white">
              {product.badge}
            </div>
            {selectedThumb?.image ? (
              <ImageWithSkeleton
                src={selectedThumb.image}
                alt={selectedThumb.name}
                fill
                sizes="486px"
                imageClassName="object-contain"
                fallback={<ProductImageFallback className="h-full w-full" />}
              />
            ) : (
              <ProductImageFallback className="h-full w-full" />
            )}
          </div>

          {shouldShowThumbnails ? (
            <div className="grid grid-cols-4 gap-3">
              {thumbnails.map((thumb) => (
                <button
                  key={thumb.id}
                  type="button"
                  aria-label={`Selecionar miniatura ${thumb.name}`}
                  onClick={() => setSelectedThumbId(thumb.id)}
                  className={`relative h-19 w-full overflow-hidden rounded-3.5 border-2 bg-white px-3 py-2 transition ${
                    selectedThumbId === thumb.id
                      ? "border-brand-yellow"
                      : "border-transparent hover:border-[#E5E7EB]"
                  }`}
                >
                  <ImageWithSkeleton
                    src={thumb.image!}
                    alt={thumb.name}
                    fill
                    sizes="120px"
                    imageClassName="object-contain p-1"
                    fallback={<ProductImageFallback className="h-full w-full" />}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-normal leading-5 tracking-[-0.150391px] text-[#99A1AF]">
            {product.category}
          </span>
          <span className="mt-2 text-8 font-black leading-9 tracking-[0.369141px] uppercase text-brand-dark sm:text-9 sm:leading-10">
            {product.name.toUpperCase()}
          </span>
          <div className="mt-4 flex items-center gap-3 text-sm text-[#6A7282]">
            <ProductRatingStars rating={product.rating} />
            <span className="leading-5 tracking-[-0.150391px]">
              {product.rating.toFixed(1)} ({product.reviews} avaliações)
            </span>
          </div>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-9 font-black leading-10 tracking-[0.369141px] text-brand-dark">
              {formatBRL(product.price)}
            </span>
            <span className="pb-1 text-xl font-normal leading-7 tracking-[-0.449219px] text-[#D1D5DC] line-through">
              {formatBRL(product.originalPrice)}
            </span>
          </div>

          <span className="mt-1 text-sm font-medium leading-5 tracking-[-0.150391px] text-[#00C950]">
            Você economiza {formatBRL(Math.max(0, product.originalPrice - product.price))}
          </span>

          <p className="mt-6 max-w-113 text-sm font-normal leading-[22.75px] tracking-[-0.150391px] text-[#4A5565]">
            {product.description}
          </p>

          <div className="mt-8 flex items-center gap-4">
            <span className="text-sm font-normal leading-5 tracking-[-0.150391px] text-[#6A7282]">Quantidade:</span>
            <div className="flex h-10.5 w-30.5 items-center rounded-full border border-[#E5E7EB] bg-white px-px">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#6A7282] transition hover:bg-[#F3F4F6]"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                <span className="text-sm leading-none">−</span>
              </button>
              <span className="w-10 text-center text-base font-black leading-6 tracking-[-0.3125px] text-brand-dark">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#6A7282] transition hover:bg-[#F3F4F6]"
                onClick={() => setQuantity((prev) => prev + 1)}
              >
                <span className="text-sm leading-none">+</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-brand-yellow px-6 text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition hover:opacity-90"
            >
              <CartIcon className="size-4.5" />
              ADICIONAR AO CARRINHO
            </button>
            <button
              type="button"
              aria-label="Adicionar aos favoritos"
              className="flex size-14 items-center justify-center rounded-full border-2 border-[#E5E7EB] bg-white text-[#99A1AF]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M9 15.2C9 15.2 3.6 11.8 2.15 8.65C0.85 5.85 1.95 3.45 4.3 3.15C5.95 2.95 7.4 3.75 8.2 5.05L9 6.35L9.8 5.05C10.6 3.75 12.05 2.95 13.7 3.15C16.05 3.45 17.15 5.85 15.85 8.65C14.4 11.8 9 15.2 9 15.2Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Compartilhar produto"
              className="flex size-14 items-center justify-center rounded-full border-2 border-[#E5E7EB] bg-white text-[#99A1AF]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M11.8125 3H15V6.1875"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.5 10.5L15 3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 10.5V13.125C15 13.6223 14.8025 14.0992 14.4508 14.4508C14.0992 14.8025 13.6223 15 13.125 15H4.875C4.37772 15 3.90081 14.8025 3.54917 14.4508C3.19754 14.0992 3 13.6223 3 13.125V4.875C3 4.37772 3.19754 3.90081 3.54917 3.54917C3.90081 3.19754 4.37772 3 4.875 3H7.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={handleBuyNow}
            className="mt-4 h-14 w-full rounded-full bg-brand-dark text-base font-black uppercase tracking-[-0.3125px] text-white transition hover:opacity-90"
          >
            COMPRAR AGORA
          </button>

          <div className="mt-6 grid grid-cols-3 rounded-2xl bg-[#F9FAFB] px-4 py-4 text-center">
            <div className="flex flex-col items-center">
              <div className="text-2xl leading-none">🚚</div>
              <div className="mt-1 text-sm font-black leading-4 text-brand-dark">Frete Grátis</div>
              <div className="mt-1 text-sm font-normal leading-4 text-[#99A1AF]">Acima de R$ 500</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl leading-none">↩️</div>
              <div className="mt-1 text-sm font-black leading-4 text-brand-dark">30 Dias</div>
              <div className="mt-1 text-sm font-normal leading-4 text-[#99A1AF]">Troca grátis</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl leading-none">🔒</div>
              <div className="mt-1 text-sm font-black leading-4 text-brand-dark">Pagamento</div>
              <div className="mt-1 text-sm font-normal leading-4 text-[#99A1AF]">100% seguro</div>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        <div className="flex items-center overflow-x-auto border-b border-[#E5E7EB]">
          <button
            type="button"
            className="h-13.5 shrink-0 border-b-2 border-brand-yellow px-4 text-sm font-black uppercase tracking-[-0.3125px] text-brand-dark md:px-8 md:text-base"
          >
            Descrição
          </button>
          <button
            type="button"
            className="h-13.5 shrink-0 px-4 text-sm font-black uppercase tracking-[-0.3125px] text-[#99A1AF] md:px-8 md:text-base"
          >
            Detalhes
          </button>
          <button
            type="button"
            className="h-13.5 shrink-0 px-4 text-sm font-black uppercase tracking-[-0.3125px] text-[#99A1AF] md:px-8 md:text-base"
          >
            <span className="md:hidden">Avaliações</span>
            <span className="hidden md:inline">Avaliações ({product.reviews})</span>
          </button>
        </div>
        <div className="px-8 py-8">
          <p className="text-sm font-normal leading-[22.75px] tracking-[-0.150391px] text-[#4A5565]">
            {product.description}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-3xl font-black leading-8 uppercase text-brand-dark md:text-8">
          Produtos Relacionados
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {relatedProducts.map((related) => (
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
    </div>
  );
}
