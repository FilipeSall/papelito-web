import { BreadcrumbChevronIcon } from "./atoms/breadcrumb-chevron-icon";
import { ProductBreadcrumbLink } from "./atoms/product-breadcrumb-link";

interface ProductBreadcrumbsProps {
  category?: { name: string; slug: string; href?: string };
  /** Nome do produto exibido no último nível do breadcrumb. */
  productName: string;
}

/**
 * Breadcrumb da página dedicada de produto.
 *
 * Segue as medidas do layout do Figma:
 * - Área interna máxima de 1084px
 * - Altura total de 49px
 * - `padding-top: 16px`, `padding-inline: 32px`, `padding-bottom: 1px`
 * - `border-bottom: 1px solid #F3F4F6`
 */
export function ProductBreadcrumbs({ category, productName }: ProductBreadcrumbsProps) {
  return (
    <section className="w-full border-b border-[#F3F4F6] bg-white">
      <div className="mx-auto h-12.25 w-full max-w-271 px-8 pt-4 pb-px">
        <nav aria-label="Breadcrumb de navegação do produto" className="flex items-center gap-2">
          <ProductBreadcrumbLink label="Home" href="/" />
          <BreadcrumbChevronIcon />
          <ProductBreadcrumbLink label="Produtos" href="/produtos" />
          {category ? (
            <>
              <BreadcrumbChevronIcon />
              <ProductBreadcrumbLink label={category.name} href={category.href ?? `/produtos?tipo=${encodeURIComponent(category.slug)}`} />
            </>
          ) : null}
          <BreadcrumbChevronIcon />
          <ProductBreadcrumbLink label={productName} isCurrent />
        </nav>
      </div>
    </section>
  );
}
