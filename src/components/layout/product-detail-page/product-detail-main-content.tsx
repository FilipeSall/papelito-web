"use client";

import { useMemo, useState } from "react";
import { ActiveVendorSummary } from "@/components/active-vendor";
import {
  ProductBenefitsBar,
  type ResolvedProductBenefit,
} from "@/components/layout/product-benefits-bar";
import type { ActiveVendor } from "@/features/active-vendor";
import type { ProductDetailItem } from "@/features/catalog";
import type { RegionBlock } from "@/features/catalog/types/region-block";
import { useAuthSession } from "@/hooks/use-auth-session";
import { toGa4Item } from "@/lib/analytics/ga4-ecommerce";
import { useEcommerceEventOnce } from "@/lib/analytics/use-ecommerce-event-once";
import { formatBRL } from "@/lib/format-currency";
import { ProductDetailDescriptionSection } from "./product-detail-description-section";
import { ProductDetailCepAvailability } from "./product-detail-cep-availability";
import { ProductDetailGallery } from "./product-detail-gallery";
import {
  buildDescriptionParagraphs,
  clampQuantity,
  resolveAvailableStock,
  resolveStockLabel,
} from "./product-detail-helpers";
import { ProductDetailPurchaseActions } from "./product-detail-purchase-actions";
import { ProductDetailQuantitySelector } from "./product-detail-quantity-selector";
import { ProductDetailRegionNotice } from "./product-detail-region-notice";
import { ProductDetailRelatedSection } from "./product-detail-related-section";
import { useProductPurchase } from "./use-product-purchase";

interface ProductDetailMainContentProps {
  /** Dados do produto atual para renderização da seção principal. */
  product: ProductDetailItem;
  initialIsFavorite?: boolean;
  activeVendor?: ActiveVendor | null;
  selectedVendorStockQty?: number | null;
  regionBlock?: RegionBlock | null;
  /** Benefícios já resolvidos para este produto, na ordem definida pelo Admin. */
  benefitItems?: ResolvedProductBenefit[];
  detailPath?: string;
  showRelatedProducts?: boolean;
}

const MAX_RELATED_PRODUCTS = 4;

/**
 * Conteúdo principal da página dedicada de produto.
 *
 * Orquestra galeria, quantidade, ações de compra e seções auxiliares.
 */
export function ProductDetailMainContent({
  product,
  initialIsFavorite = false,
  activeVendor = null,
  selectedVendorStockQty = null,
  regionBlock = null,
  benefitItems = [],
  detailPath,
  showRelatedProducts = true,
}: Readonly<ProductDetailMainContentProps>) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const { status, role } = useAuthSession();

  const availableStock = resolveAvailableStock(selectedVendorStockQty);
  const quantity = product.isKit ? 1 : clampQuantity(selectedQuantity, availableStock);
  const quantitySelectorStock = product.isKit ? 1 : availableStock;
  const hasDiscount = product.originalPrice > product.price;
  const showPublicCepAvailability =
    status === "unauthenticated" ||
    (status === "authenticated" &&
      role === "customer" &&
      regionBlock?.kind === "missing_cep");

  const descriptionParagraphs = useMemo(
    () => buildDescriptionParagraphs(product.description),
    [product.description],
  );
  const longDescriptionParagraphs = useMemo(
    () => buildDescriptionParagraphs(product.longDescription ?? product.description),
    [product.description, product.longDescription],
  );
  const relatedProducts = useMemo(
    () => product.relatedThumbs.slice(0, MAX_RELATED_PRODUCTS),
    [product.relatedThumbs],
  );

  const viewItemPayload = useMemo(
    () => [
      toGa4Item({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      }),
    ],
    [product.category, product.id, product.name, product.price],
  );

  useEcommerceEventOnce("view_item", viewItemPayload, product.id);

  const purchase = useProductPurchase({
    product,
    quantity,
    availableStock,
    regionBlock,
    onQuantityClamp: setSelectedQuantity,
    detailPath,
  });

  const vendorSummary = purchase.isOutOfStock ? activeVendor : null;

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[486px_minmax(0,486px)] xl:gap-12">
        <ProductDetailGallery product={product} />

        <div className="flex flex-col">
          <span className="text-sm font-normal leading-5 tracking-[-0.150391px] text-[#99A1AF]">
            {product.category}
          </span>
          <span className="mt-2 text-8 font-black leading-9 tracking-[0.369141px] uppercase text-brand-dark sm:text-9 sm:leading-10">
            {product.name.toUpperCase()}
          </span>
          <p className="mt-1 text-sm font-normal leading-5 tracking-[-0.150391px] text-[#99A1AF]">
            {showPublicCepAvailability
              ? "Consulte a disponibilidade por CEP abaixo"
              : resolveStockLabel(selectedVendorStockQty)}
          </p>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-[36px] font-black leading-10 tracking-[0.369141px] text-brand-dark">
              {formatBRL(product.price)}
            </span>
            {hasDiscount ? (
              <span className="pb-1 text-xl font-normal leading-7 tracking-[-0.449219px] text-[#D1D5DC] line-through">
                {formatBRL(product.originalPrice)}
              </span>
            ) : null}
          </div>

          {hasDiscount ? (
            <span className="mt-1 text-sm font-medium leading-5 tracking-[-0.150391px] text-[#00C950]">
              Você economiza {formatBRL(product.originalPrice - product.price)}
            </span>
          ) : null}

          <div className="mt-6 flex max-w-113 flex-col gap-3">
            {descriptionParagraphs.map((paragraph) => (
              <p
                key={paragraph.id}
                className="whitespace-pre-line text-sm font-normal leading-[22.75px] tracking-[-0.150391px] text-[#4A5565]"
              >
                {paragraph.text}
              </p>
            ))}
          </div>

          <ProductDetailQuantitySelector
            quantity={quantity}
            availableStock={quantitySelectorStock}
            disabled={purchase.isPurchaseDisabled}
            onQuantityChange={setSelectedQuantity}
          />

          {purchase.regionNotice ? (
            <ProductDetailRegionNotice regionBlock={purchase.regionNotice} />
          ) : null}

          <ProductDetailPurchaseActions
            productId={product.id}
            productName={product.name}
            initialIsFavorite={initialIsFavorite}
            isAddingToCart={purchase.isAddingToCart}
            isPurchaseDisabled={purchase.isPurchaseDisabled}
            isPurchaseBlockedByRole={purchase.isPurchaseBlockedByRole}
            roleBlockedMessage={purchase.roleBlockedMessage}
            onAddToCart={purchase.addToCart}
            onBuyNow={purchase.buyNow}
          />

          {vendorSummary ? (
            <div className="mt-4">
              <ActiveVendorSummary
                vendor={vendorSummary}
                changeHref={`${detailPath ?? `/produtos/${product.id}`}/escolher-vendor`}
              />
            </div>
          ) : null}

          <ProductBenefitsBar items={benefitItems} />
        </div>
      </div>

      <ProductDetailDescriptionSection paragraphs={longDescriptionParagraphs} />

      {showPublicCepAvailability ? (
        <ProductDetailCepAvailability productId={product.id} />
      ) : null}

      {showRelatedProducts ? <ProductDetailRelatedSection products={relatedProducts} /> : null}
    </div>
  );
}
