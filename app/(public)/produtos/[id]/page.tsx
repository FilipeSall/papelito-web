import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import {
  ProductBreadcrumbs,
  ProductDetailMainSection,
} from "@/components/layout/product-detail-page";
import { AddToCartToastHost } from "@/components/layout/products-page/add-to-cart-toast-host";
import { fetchProductFavoriteStatus } from "@/features/favorites";
import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { getCoverage } from "@/features/catalog/services/get-coverage";
import { getProductDetail } from "@/features/catalog/services/get-product-detail";
import { getHomeFlashSale } from "@/features/catalog/services/get-home-flash-sale";
import { applyFlashSaleToProductDetail } from "@/features/catalog/services/apply-flash-sale-to-product";
import {
  createRegionBlock,
  type RegionBlock,
} from "@/features/catalog/types/region-block";
import { getActiveVendor } from "@/features/active-vendor/server";
import { getFreeShippingThreshold } from "@/features/shipping/services/get-free-shipping-threshold";
import { getProductBenefits } from "@/features/catalog/services/get-product-benefits";
import { getPaymentConfig } from "@/features/rich-text/services/get-payment-config";
import { buildRichTextContext } from "@/features/rich-text";
import { resolveProductBenefits } from "@/components/layout/product-benefits-bar";
import { authOptions } from "@/lib/auth";
import {
  JsonLd,
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

interface ProdutoDetalhePageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Título, descrição e cartão social do produto.
 *
 * Reaproveita `getProductDetail`, que já é cacheado por 5 minutos com a tag `wp:product:{id}` —
 * o metadata não custa uma consulta a mais ao WordPress.
 */
export async function generateMetadata({ params }: Readonly<ProdutoDetalhePageProps>) {
  const { id } = await params;
  const product = await getProductDetail(id);

  if (!product) {
    return { title: "Produto não encontrado", robots: { index: false, follow: false } };
  }

  return buildPageMetadata({
    title: `${product.name} — ${product.category} para revenda`,
    description: buildProductDescription(product.name, product.category, product.description),
    path: `/produtos/${product.id}`,
    ...(product.image ? { image: { url: product.image, alt: product.name } } : {}),
  });
}

/**
 * Descrição curta para busca e cartão social.
 *
 * Prefere a descrição real do produto, limpa de markup, e só cai no texto de posicionamento
 * quando o cadastro não tem descrição — nunca inventa característica de produto.
 */
function buildProductDescription(name: string, category: string, description: string) {
  const plain = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  if (plain.length >= 60) {
    return plain.length > 300 ? `${plain.slice(0, 297).trimEnd()}...` : plain;
  }

  return `${name} (${category}) no catálogo B2B da Papelito. Compra para empresas com CNPJ, preço de revenda e entrega por revendedor regional em todo o Brasil.`;
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
  const [
    product,
    flashSaleCampaign,
    initialIsFavorite,
    activeVendorResult,
    freeShippingThreshold,
    paymentConfig,
    productBenefits,
  ] = await Promise.all([
    getProductDetail(id),
    getHomeFlashSale(),
    fetchProductFavoriteStatus(id, session?.accessToken),
    session?.user ? getActiveVendor() : Promise.resolve(null),
    getFreeShippingThreshold(),
    getPaymentConfig(),
    getProductBenefits(id),
  ]);

  if (!product) {
    notFound();
  }

  const displayedProduct = applyFlashSaleToProductDetail(product, flashSaleCampaign);

  const benefitItems = resolveProductBenefits(
    productBenefits.items,
    buildRichTextContext({
      freeShippingMinimumCents: freeShippingThreshold?.minimumOrderCents ?? null,
      flashSaleCampaign,
      paymentConfig,
    }),
  );

  const activeVendor =
    activeVendorResult && activeVendorResult.ok ? activeVendorResult.vendor : null;
  let selectedVendorStockQty: number | null = null;
  let regionBlock: RegionBlock | null = null;

  if (activeVendorResult && !activeVendorResult.ok) {
    if (activeVendorResult.error.reason === "no_vendor_available") {
      regionBlock = createRegionBlock("no_vendor");
    } else if (activeVendorResult.error.reason === "missing_cep") {
      regionBlock = createRegionBlock("missing_cep");
    }
  }

  if (activeVendor) {
    const { cep } = await getAccountCoverageCepContext();

    if (cep) {
      const coverage = await getCoverage(cep, [displayedProduct.id], activeVendor.vendorId).catch(
        () => null,
      );
      selectedVendorStockQty = coverage?.[displayedProduct.id]?.bestVendor?.qty ?? null;

      if (coverage && coverage[displayedProduct.id]?.hasCoverage === false) {
        regionBlock = createRegionBlock("no_product_coverage");
      }
    } else {
      regionBlock = createRegionBlock("missing_cep");
    }
  }

  return (
    <main className="flex min-h-80 flex-col bg-[#F9FAFB]">
      <JsonLd
        data={buildProductJsonLd({
          name: displayedProduct.name,
          description: displayedProduct.description,
          image: displayedProduct.image,
          category: displayedProduct.category,
          sku: displayedProduct.sku,
          price: displayedProduct.price,
          path: `/produtos/${displayedProduct.id}`,
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Produtos", path: "/produtos" },
          { name: product.category, path: `/categorias/${product.type}` },
          { name: product.name },
        ])}
      />
      <ProductBreadcrumbs
        category={{ name: product.category, slug: product.type }}
        productName={product.name}
      />
      <ProductDetailMainSection
        product={displayedProduct}
        initialIsFavorite={initialIsFavorite}
        activeVendor={activeVendor}
        selectedVendorStockQty={selectedVendorStockQty}
        regionBlock={regionBlock}
        benefitItems={benefitItems}
      />
      <AddToCartToastHost />
    </main>
  );
}
