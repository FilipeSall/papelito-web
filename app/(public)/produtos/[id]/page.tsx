import { use } from "react";
import { notFound } from "next/navigation";
import {
  ProductBreadcrumbs,
  ProductDetailMainSection,
} from "@/components/layout/product-detail-page";
import { AddToCartToastHost } from "@/components/layout/products-page/add-to-cart-toast-host";
import { useProductDetail } from "@/features/catalog";
import { resolveProductImage } from "@/features/catalog/utils/resolve-product-image";

interface ProdutoDetalhePageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?:
    | Promise<{
        img?: string | string[];
      }>
    | {
        img?: string | string[];
      };
}

function readSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function sanitizeNavigationImage(imageParam: string | undefined): string | null {
  if (!imageParam || !imageParam.startsWith("/images/") || imageParam.includes("..")) {
    return null;
  }

  return resolveProductImage({ productImageUrl: imageParam }) ?? null;
}

/**
 * Página dedicada de produto (MVP).
 *
 * Nesta etapa inicial, renderiza apenas o breadcrumb seguindo
 * as especificações do Figma.
 */
export default function ProdutoDetalhePage({
  params,
  searchParams,
}: ProdutoDetalhePageProps) {
  const { id } = use(params);
  const resolvedSearchParams = use(Promise.resolve(searchParams ?? {}));
  const imageFromNavigation = readSingleParam(resolvedSearchParams.img);
  const safeNavigationImage = sanitizeNavigationImage(imageFromNavigation);
  const product = use(useProductDetail(id));

  if (!product) {
    notFound();
  }

  const resolvedProduct =
    typeof safeNavigationImage === "string" && safeNavigationImage.length > 0
      ? {
          ...product,
          image: safeNavigationImage,
        }
      : product;

  return (
    <main className="flex min-h-80 flex-col bg-[#F9FAFB]">
      <ProductBreadcrumbs productName={resolvedProduct.name} />
      <ProductDetailMainSection product={resolvedProduct} />
      <AddToCartToastHost />
    </main>
  );
}
