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

interface ProfileWishlistProps {
  initialItems?: FavoriteProductItem[];
}

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
      <section className="flex flex-1 flex-col gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-[-0.45px] text-brand-dark">
            Meus Favoritos
          </h2>
          <p className="text-sm text-gray-400">0 produtos salvos</p>
        </div>

        <ProfileEmptyShoppingState
          ctaLabel="Descobrir produtos"
          description="Quando voce começar a salvar produtos, seus favoritos ficam aqui para facilitar a recompra e comparar novidades com calma."
          title="Nenhum favorito por enquanto"
        />
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-[-0.45px] text-brand-dark">
            Meus Favoritos
          </h2>
          <p className="text-sm text-gray-400">{items.length} produtos salvos</p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#E8DED0] bg-[#FFF8EB] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-brand-dark/70">
          <span className="h-2 w-2 rounded-full bg-[#D96952]" />
          Sua curadoria
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {items.map((item) => {
          const isRemoving = pendingProductId === item.productId;
          const hasDiscount = item.originalPrice > item.price;

          return (
            <article
              key={item.productId}
              className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="h-1.5 bg-brand-yellow" />

              <div className="flex h-full flex-col gap-5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full border border-[#EEE7DA] bg-[#FCFAF5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-dark/55">
                    {item.category}
                  </span>
                </div>

                <div className="grid grid-cols-[108px_minmax(0,1fr)] gap-4">
                  <Link
                    href={`/produtos/${item.productId}`}
                    className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px] border border-[#EFE8DC] bg-[linear-gradient(180deg,#FFFDF8_0%,#F8F4EC_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                  >
                    {item.image ? (
                      <ImageWithSkeleton
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="112px"
                        imageClassName="object-contain"
                        fallback={<ProductImageFallback className="h-full w-full" />}
                      />
                    ) : (
                      <ProductImageFallback className="h-full w-full" />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-col">
                    <Link
                      href={`/produtos/${item.productId}`}
                      className="block text-lg font-black uppercase leading-6 tracking-[-0.36px] text-brand-dark transition hover:opacity-80"
                    >
                      {item.name}
                    </Link>

                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <span className="text-3xl font-black leading-none text-brand-dark">
                        {formatBRL(item.price)}
                      </span>
                      {hasDiscount ? (
                        <span className="pb-0.5 text-sm text-[#99A1AF] line-through">
                          {formatBRL(item.originalPrice)}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {hasDiscount ? (
                        <span className="rounded-full bg-[#EAFBF1] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#00A86B]">
                          Economiza {formatBRL(item.originalPrice - item.price)}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-[#F4F4F5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-dark/55">
                        {item.stockStatus === "IN_STOCK" ? "Em estoque" : "Consulte disponibilidade"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-3 border-t border-[#F0EBE2] pt-4">
                  <AddToCartButton
                    label="Adicionar"
                    className="min-w-0 flex-1 px-5"
                    product={{
                      id: item.productId,
                      category: item.category,
                      name: item.name,
                      image: item.image,
                      price: item.price,
                      originalPrice: item.originalPrice,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(item.productId)}
                    disabled={isRemoving}
                    aria-label="Remover dos favoritos"
                    className="inline-flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-full border border-[#E5D5D1] bg-[#FFF7F4] text-[#B6432D] transition hover:border-[#D96952] hover:bg-[#FFF1EB] disabled:opacity-60"
                  >
                    {isRemoving ? (
                      <span className="h-4 w-4 animate-pulse rounded-full bg-current/25" aria-hidden />
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          d="M2.66699 4H13.3337"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6.00033 2H10.0003"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M5.33301 6.66675V11.3334"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8 6.66675V11.3334"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10.667 6.66675V11.3334"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M4 4L4.66667 13.3333C4.71422 13.9521 5.23008 14.4302 5.85067 14.4302H10.1493C10.7699 14.4302 11.2858 13.9521 11.3333 13.3333L12 4"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
