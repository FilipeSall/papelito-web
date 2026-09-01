"use client";

import Link from "next/link";
import { useState } from "react";

import { AddToCartButton, ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import { signOutAndClearSession } from "@/features/auth/client/logout";
import {
  FavoritesAuthError,
  removeFavoriteClient,
} from "@/features/favorites/client/favorites-api";
import type { FavoriteProductItem } from "@/features/favorites/types/favorites";
import { formatBRL } from "@/lib/format-currency";

import { ProfileEmptyShoppingState } from "./profile-empty-shopping-state";
import { ProfilePageTitle, ProfilePanel } from "./profile-panel";

interface ProfileWishlistProps {
  initialItems?: FavoriteProductItem[];
}

const tagClass =
  "inline-flex items-center border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]";

function describeSavedItems(count: number) {
  if (count === 0) {
    return "Nenhum produto salvo até agora.";
  }

  return count === 1 ? "1 produto salvo." : `${count} produtos salvos.`;
}

/**
 * Grade de produtos favoritados da conta, com remoção e recompra direta.
 */
export function ProfileWishlist({ initialItems = [] }: ProfileWishlistProps) {
  const [items, setItems] = useState(initialItems);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  async function handleRemove(productId: string) {
    if (pendingProductId) {
      return;
    }

    setPendingProductId(productId);

    try {
      await removeFavoriteClient(productId);
      setItems((current) => current.filter((item) => item.productId !== productId));
    } catch (error) {
      if (error instanceof FavoritesAuthError) {
        await signOutAndClearSession({ callbackUrl: "/entrar" });
        return;
      }

      console.error("[favorites] remove failed", error);
    } finally {
      setPendingProductId(null);
    }
  }

  if (items.length === 0) {
    return (
      <section className="flex flex-1 flex-col gap-7">
        <ProfilePageTitle description={describeSavedItems(0)} title="Meus favoritos" />

        <ProfileEmptyShoppingState
          ctaLabel="Descobrir produtos"
          description="Quando você começar a salvar produtos, seus favoritos ficam aqui para facilitar a recompra e comparar novidades com calma."
          title="Nenhum favorito por enquanto"
        />
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-7">
      <ProfilePageTitle description={describeSavedItems(items.length)} title="Meus favoritos" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {items.map((item) => {
          const isRemoving = pendingProductId === item.productId;
          const hasDiscount = item.originalPrice > item.price;

          return (
            <ProfilePanel accent className="flex h-full flex-col" key={item.productId} tone="white">
              <article className="flex h-full flex-col">
                <div className="flex gap-5 p-5">
                  <Link
                    className="relative flex aspect-square w-26 shrink-0 items-center justify-center overflow-hidden border-2 border-[#1a1a1a] bg-[#faf8f2] p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] sm:w-33"
                    href={`/produtos/${item.productId}`}
                    tabIndex={-1}
                  >
                    {item.image ? (
                      <ImageWithSkeleton
                        alt={item.name}
                        fallback={<ProductImageFallback className="h-full w-full" />}
                        fill
                        imageClassName="object-contain"
                        sizes="132px"
                        src={item.image}
                      />
                    ) : (
                      <ProductImageFallback className="h-full w-full" />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={`${tagClass} self-start border-[#1a1a1a] bg-white text-[#1a1a1a]`}
                    >
                      {item.category}
                    </span>

                    <Link
                      className="mt-2.5 block text-lg font-black uppercase leading-6 tracking-tight text-[#1a1a1a] transition-colors hover:text-[#1a1a1a]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
                      href={`/produtos/${item.productId}`}
                    >
                      {item.name}
                    </Link>

                    <div className="mt-auto pt-3">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-2xl font-black leading-none tracking-tight text-[#1a1a1a] tabular-nums">
                          {formatBRL(item.price)}
                        </span>
                        {hasDiscount ? (
                          <span className="text-sm font-bold text-[#1a1a1a]/55 line-through tabular-nums">
                            {formatBRL(item.originalPrice)}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {hasDiscount ? (
                          <span
                            className={`${tagClass} border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]`}
                          >
                            Economiza {formatBRL(item.originalPrice - item.price)}
                          </span>
                        ) : null}
                        <span
                          className={`${tagClass} border-[#1a1a1a]/25 bg-transparent text-[#1a1a1a]/70`}
                        >
                          {item.stockStatus === "IN_STOCK"
                            ? "Em estoque"
                            : "Consulte disponibilidade"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-stretch gap-3 border-t-2 border-[#1a1a1a]/12 px-5 py-4">
                  <AddToCartButton
                    className="min-w-0 flex-1"
                    label="Adicionar"
                    product={{
                      id: item.productId,
                      category: item.category,
                      name: item.name,
                      image: item.image,
                      price: item.price,
                      originalPrice: item.originalPrice,
                      promotionContext: item.promotionContext,
                    }}
                    variant="panel"
                  />
                  <button
                    aria-label={`Remover ${item.name} dos favoritos`}
                    className="inline-flex h-11 w-11 flex-none cursor-pointer items-center justify-center border-2 border-[#c0392b] bg-white text-[#c0392b] transition-colors hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c0392b]"
                    disabled={isRemoving}
                    onClick={() => handleRemove(item.productId)}
                    type="button"
                  >
                    {isRemoving ? (
                      <span aria-hidden className="h-4 w-4 animate-pulse bg-current/30" />
                    ) : (
                      <svg
                        aria-hidden
                        fill="none"
                        height="16"
                        viewBox="0 0 16 16"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.66699 4H13.3337"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.6"
                        />
                        <path
                          d="M6.00033 2H10.0003"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.6"
                        />
                        <path
                          d="M5.33301 6.66675V11.3334"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.6"
                        />
                        <path
                          d="M8 6.66675V11.3334"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.6"
                        />
                        <path
                          d="M10.667 6.66675V11.3334"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.6"
                        />
                        <path
                          d="M4 4L4.66667 13.3333C4.71422 13.9521 5.23008 14.4302 5.85067 14.4302H10.1493C10.7699 14.4302 11.2858 13.9521 11.3333 13.3333L12 4"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.6"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </article>
            </ProfilePanel>
          );
        })}
      </div>
    </section>
  );
}
