"use client";

import { useEffect, useMemo, useState } from "react";

type WishlistItem = {
  id: string;
  name: string;
  category: string;
  price: number;
};

const WISHLIST_MOCK_ITEMS: WishlistItem[] = [
  { id: "alfafa-king-size", name: "Alfafa King Size", category: "Seda", price: 12.9 },
  { id: "hemp-king-size", name: "Hemp King Size", category: "Seda", price: 14.9 },
  { id: "pink-queen-size", name: "Pink Queen Size", category: "Seda", price: 13.9 },
  { id: "bag-tradicional", name: "Bag Tradicional", category: "Acessorio", price: 19.9 },
  { id: "insane-brown", name: "Insane Brown", category: "Seda", price: 15.9 },
];

const DEFAULT_WISHLIST_IDS = WISHLIST_MOCK_ITEMS.map((item) => item.id);
const WISHLIST_STORAGE_KEY = "papelito:wishlist:v1";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseWishlistFromStorage(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function ProfileWishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_WISHLIST_IDS;
    }

    // TODO(backend-whistllisty): substituir leitura local por GET /api/account/wishlist
    // e popular a lista com os itens reais do usuario autenticado.
    const storedIds = parseWishlistFromStorage(localStorage.getItem(WISHLIST_STORAGE_KEY));
    return storedIds.length > 0 ? storedIds : DEFAULT_WISHLIST_IDS;
  });

  useEffect(() => {
    // TODO(backend-whistllisty): remover localStorage e persistir alteracoes via
    // POST/DELETE no backend (wishlist do usuario).
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  const wishlistItems = useMemo(
    () => WISHLIST_MOCK_ITEMS.filter((item) => wishlistIds.includes(item.id)),
    [wishlistIds],
  );

  function removeItem(itemId: string) {
    setWishlistIds((current) => current.filter((id) => id !== itemId));
  }

  function resetMockData() {
    setWishlistIds(DEFAULT_WISHLIST_IDS);
  }

  function clearWishlist() {
    setWishlistIds([]);
  }

  return (
    <section className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-[-0.45px] text-brand-dark">
            Meus Favoritos
          </h2>
          <p className="text-sm text-gray-400">{wishlistItems.length} produtos salvos</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center rounded-full border border-brand-dark px-4 text-xs font-black uppercase tracking-[0.3px] text-brand-dark transition hover:bg-brand-dark hover:text-white"
            onClick={resetMockData}
            type="button"
          >
            Adicionar exemplos
          </button>
          <button
            className="inline-flex h-9 items-center rounded-full bg-brand-dark px-4 text-xs font-black uppercase tracking-[0.3px] text-white transition hover:opacity-90"
            onClick={clearWishlist}
            type="button"
          >
            Limpar lista
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        {wishlistItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-brand-dark">Sua wishlist esta vazia.</p>
            <p className="mt-2 text-xs text-gray-500">
              Adicione produtos para acompanhar seus favoritos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {wishlistItems.map((item) => (
              <article
                className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-4"
                key={item.id}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium uppercase tracking-[0.3px] text-gray-400">
                    {item.category}
                  </p>
                  <p className="text-sm font-black text-brand-dark">{item.name}</p>
                  <p className="text-base font-black text-brand-dark">
                    {formatCurrency(item.price)}
                  </p>
                </div>

                <button
                  className="inline-flex h-8 items-center rounded-full border border-red-300 px-3 text-xs font-black uppercase tracking-[0.3px] text-red-500 transition hover:bg-red-500 hover:text-white"
                  onClick={() => removeItem(item.id)}
                  type="button"
                >
                  Remover
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
