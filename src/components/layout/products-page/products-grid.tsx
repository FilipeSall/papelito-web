"use client";

import { useEffect, useRef, useState } from "react";
import { AddToCartToast } from "./add-to-cart-toast";
import { ProductGridCard, type ProductGridItem } from "./product-grid-card";

interface ProductsGridProps {
  /** Lista de produtos para exibir no grid */
  products: ProductGridItem[];
}

/**
 * Grid de produtos da página de listagem.
 *
 * Componente molecular que organiza os cards de produtos em um layout
 * responsivo de grid. Exibe 1 coluna em mobile, 2 em tablets e 3 em desktop.
 *
 * @example
 * ```tsx
 * <ProductsGrid products={products} />
 * ```
 */
export function ProductsGrid({ products }: ProductsGridProps) {
  const [toastProductName, setToastProductName] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterAnimationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (removeTimeoutRef.current) {
        clearTimeout(removeTimeoutRef.current);
      }
      if (enterAnimationFrameRef.current) {
        cancelAnimationFrame(enterAnimationFrameRef.current);
      }
    };
  }, []);

  function handleAddedToCart(productName: string) {
    setToastVisible(false);
    setToastProductName(productName);

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (removeTimeoutRef.current) {
      clearTimeout(removeTimeoutRef.current);
    }
    if (enterAnimationFrameRef.current) {
      cancelAnimationFrame(enterAnimationFrameRef.current);
    }

    enterAnimationFrameRef.current = requestAnimationFrame(() => {
      setToastVisible(true);
    });

    hideTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 1800);

    removeTimeoutRef.current = setTimeout(() => {
      setToastProductName(null);
    }, 2050);
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-muted text-sm">
          Nenhum produto encontrado.
        </p>
      </div>
    );
  }

  return (
    <>
      {toastProductName && (
        <AddToCartToast
          productName={toastProductName}
          visible={toastVisible}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductGridCard
            key={product.id}
            product={product}
            onAddedToCart={handleAddedToCart}
          />
        ))}
      </div>
    </>
  );
}
