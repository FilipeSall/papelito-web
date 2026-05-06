import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import {
  ProductBreadcrumbs,
  ProductDetailMainSection,
} from "@/components/layout/product-detail-page";
import { AddToCartToastHost } from "@/components/layout/products-page/add-to-cart-toast-host";
import { fetchProductFavoriteStatus } from "@/features/favorites";
import { getProductDetail } from "@/features/catalog/services/get-product-detail";
import { authOptions } from "@/lib/auth";

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
export default async function ProdutoDetalhePage({
  params,
}: ProdutoDetalhePageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const [product, initialIsFavorite] = await Promise.all([
    getProductDetail(id),
    fetchProductFavoriteStatus(id, session?.accessToken),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="flex min-h-80 flex-col bg-[#F9FAFB]">
      <ProductBreadcrumbs productName={product.name} />
      <ProductDetailMainSection
        product={product}
        initialIsFavorite={initialIsFavorite}
      />
      <AddToCartToastHost />
    </main>
  );
}
