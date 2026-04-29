import { use } from "react";
import { notFound } from "next/navigation";
import {
  ProductBreadcrumbs,
  ProductDetailMainSection,
} from "@/components/layout/product-detail-page";
import { AddToCartToastHost } from "@/components/layout/products-page/add-to-cart-toast-host";
import { useProductDetail } from "@/features/catalog";

interface ProdutoDetalhePageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Página dedicada de produto (MVP).
 *
 * Nesta etapa inicial, renderiza apenas o breadcrumb seguindo
 * as especificações do Figma.
 */
export default function ProdutoDetalhePage({
  params,
}: ProdutoDetalhePageProps) {
  const { id } = use(params);
  const product = use(useProductDetail(id));

  if (!product) {
    notFound();
  }

  return (
    <main className="flex min-h-80 flex-col bg-[#F9FAFB]">
      <ProductBreadcrumbs productName={product.name} />
      <ProductDetailMainSection product={product} />
      <AddToCartToastHost />
    </main>
  );
}
