"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  ADD_TO_CART_EVENT_NAME,
  type AddToCartEventDetail,
} from "@/components/ui/add-to-cart-button";
import { ActiveVendorSummary } from "@/components/active-vendor";
import { FavoriteToggleButton, ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import { CartIcon } from "@/components/ui/icons";
import { resolveCartVendor, useCartStore, type ResolveCartVendorResult } from "@/features/cart";
import type { ActiveVendor } from "@/features/active-vendor";
import type { ProductDetailItem } from "@/features/catalog";
import { formatBRL } from "@/lib/format-currency";

interface ProductDetailMainContentProps {
  /** Dados do produto atual para renderização da seção principal. */
  product: ProductDetailItem;
  initialIsFavorite?: boolean;
  activeVendor?: ActiveVendor | null;
  selectedVendorStockQty?: number | null;
}

const EMPTY_GALLERY: ProductDetailItem["galleryImages"] = [];

/**
 * Conteúdo principal da página dedicada de produto.
 *
 * Controla estados interativos locais:
 * - seleção de miniatura
 * - quantidade para adicionar ao carrinho
 */
export function ProductDetailMainContent({
  product,
  initialIsFavorite = false,
  activeVendor = null,
  selectedVendorStockQty = null,
}: ProductDetailMainContentProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const applyVendorToCart = useCartStore((state) => state.applyVendorToCart);
  const cartItems = useCartStore((state) => state.items);
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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const availableStock =
    typeof selectedVendorStockQty === "number" && Number.isFinite(selectedVendorStockQty)
      ? Math.max(0, Math.floor(selectedVendorStockQty))
      : null;
  const isOutOfStock = availableStock !== null && availableStock <= 0;
  const isQuantityAtMax = availableStock !== null && quantity >= availableStock;

  const selectedThumb = useMemo(
    () => thumbnails.find((thumb) => thumb.id === selectedThumbId) ?? thumbnails[0],
    [selectedThumbId, thumbnails],
  );
  const relatedProducts = useMemo(() => product.relatedThumbs.slice(0, 4), [product.relatedThumbs]);
  const shouldShowThumbnails = thumbnails.length > 1;

  useEffect(() => {
    if (availableStock === null) {
      return;
    }

    setQuantity((current) => {
      if (availableStock <= 0) {
        return 0;
      }

      return Math.min(Math.max(1, current), availableStock);
    });
  }, [availableStock]);

  function dispatchCartEvent(detail: AddToCartEventDetail) {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent<AddToCartEventDetail>(ADD_TO_CART_EVENT_NAME, {
        detail,
      }),
    );
  }

  function dispatchResolveFailure(result: Exclude<ResolveCartVendorResult, { status: "ok" }>) {
    dispatchCartEvent({
      title:
        result.status === "missing_cep"
          ? "CEP necessario"
          : result.status === "vendor_conflict"
            ? "Vendor indisponivel"
            : "Disponibilidade indisponivel",
      message: result.message,
      tone: result.status === "vendor_conflict" ? "warning" : "error",
      href: result.href,
      actionLabel: result.status === "missing_cep" ? "Cadastrar CEP" : undefined,
    });
  }

  async function addCurrentProductToCart() {
    if (status === "loading") return;

    if (status !== "authenticated") {
      router.push("/entrar");
      return false;
    }

    if (isAddingToCart) {
      return false;
    }

    if (isOutOfStock) {
      dispatchCartEvent({
        title: "Produto indisponivel",
        message: "O vendor selecionado esta sem estoque deste produto.",
        tone: "warning",
      });
      return false;
    }

    if (availableStock !== null && quantity > availableStock) {
      setQuantity(availableStock);
      dispatchCartEvent({
        title: "Estoque limitado",
        message: `Este vendor tem ${availableStock} unidade(s) disponivel(is).`,
        tone: "warning",
      });
      return false;
    }

    setIsAddingToCart(true);

    try {
      const result = await resolveCartVendor({
        product: {
          id: product.id,
          quantity,
        },
        currentItems: cartItems,
      });

      if (result.status !== "ok") {
        dispatchResolveFailure(result);
        return false;
      }

      applyVendorToCart(result.vendor);
      addItem(
        {
          id: product.id,
          name: product.name,
          category: product.category,
          image: product.image,
          price: product.price,
          originalPrice: product.originalPrice,
          ...result.vendor,
        },
        quantity,
      );

      dispatchCartEvent({
        productName: product.name,
        tone: "success",
      });

      return true;
    } catch {
      dispatchCartEvent({
        title: "Disponibilidade indisponivel",
        message: "Nao foi possivel validar a disponibilidade por CEP agora.",
        tone: "error",
      });
      return false;
    } finally {
      setIsAddingToCart(false);
    }
  }

  function handleAddToCart() {
    void addCurrentProductToCart();
  }

  async function handleBuyNow() {
    const added = await addCurrentProductToCart();

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
          <p className="mt-1 text-sm font-normal leading-5 tracking-[-0.150391px] text-[#99A1AF]">
            {typeof selectedVendorStockQty === "number"
              ? selectedVendorStockQty > 0
                ? `${selectedVendorStockQty} em estoque`
                : "Sem estoque no vendor selecionado"
              : "Estoque regional não consultado"}
          </p>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-9 font-black leading-10 tracking-[0.369141px] text-brand-dark">
              {formatBRL(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="pb-1 text-xl font-normal leading-7 tracking-[-0.449219px] text-[#D1D5DC] line-through">
                {formatBRL(product.originalPrice)}
              </span>
            )}
          </div>

          {product.originalPrice > product.price && (
            <span className="mt-1 text-sm font-medium leading-5 tracking-[-0.150391px] text-[#00C950]">
              Você economiza {formatBRL(product.originalPrice - product.price)}
            </span>
          )}

          <p className="mt-6 max-w-113 text-sm font-normal leading-[22.75px] tracking-[-0.150391px] text-[#4A5565]">
            {product.description}
          </p>

          <div className="mt-8 flex items-center gap-4">
            <span className="text-sm font-normal leading-5 tracking-[-0.150391px] text-[#6A7282]">Quantidade:</span>
            <div className="flex h-10.5 w-30.5 items-center rounded-full border border-[#E5E7EB] bg-white px-px">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#6A7282] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                disabled={isOutOfStock || quantity <= 1}
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
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#6A7282] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                disabled={isOutOfStock || isQuantityAtMax}
                onClick={() =>
                  setQuantity((prev) =>
                    availableStock === null ? prev + 1 : Math.min(availableStock, prev + 1),
                  )
                }
              >
                <span className="text-sm leading-none">+</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart || isOutOfStock}
              className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-yellow px-6 text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CartIcon className="size-4.5" />
              {isAddingToCart ? "VALIDANDO" : "ADICIONAR AO CARRINHO"}
            </button>
            <FavoriteToggleButton
              productId={product.id}
              initialIsFavorite={initialIsFavorite}
            />
            <button
              type="button"
              aria-label="Compartilhar produto"
              className="flex size-14 cursor-pointer items-center justify-center rounded-full border-2 border-[#E5E7EB] bg-white text-[#99A1AF]"
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
            disabled={isAddingToCart || isOutOfStock}
            className="mt-4 h-14 w-full cursor-pointer rounded-full bg-brand-dark text-base font-black uppercase tracking-[-0.3125px] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAddingToCart ? "VALIDANDO" : "COMPRAR AGORA"}
          </button>

          {activeVendor ? (
            <div className="mt-4">
              <ActiveVendorSummary
                vendor={activeVendor}
                changeHref={`/produtos/${product.id}/escolher-vendor`}
              />
            </div>
          ) : null}

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
        <div className="border-b border-[#E5E7EB]">
          <div className="inline-flex h-13.5 items-center border-b-2 border-brand-yellow px-4 text-sm font-black uppercase tracking-[-0.3125px] text-brand-dark md:px-8 md:text-base">
            Descrição
          </div>
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
