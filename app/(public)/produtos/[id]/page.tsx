import { use } from "react";
import { notFound } from "next/navigation";
import { access } from "node:fs/promises";
import path from "node:path";
import {
  ProductBreadcrumbs,
  ProductDetailMainSection,
} from "@/components/layout/product-detail-page";
import { useProductDetail } from "@/features/catalog";

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

async function resolveNavigationImage(imageParam: string | undefined) {
  if (!imageParam || !imageParam.startsWith("/") || imageParam.includes("..")) {
    return null;
  }

  const filePath = path.join(process.cwd(), "public", imageParam);

  try {
    await access(filePath);
    return imageParam;
  } catch {
    return null;
  }
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
  const safeNavigationImage = use(resolveNavigationImage(imageFromNavigation));
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
    </main>
  );
}
