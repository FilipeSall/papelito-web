import Link from "next/link";
import { ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import { ProductListCartControls } from "./product-list-cart-controls";
import type { ProductGridItem } from "./product-grid-card";

function StarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 1L7.41 4.05L10.8 4.32L8.28 6.52L9.05 9.84L6 8.03L2.95 9.84L3.72 6.52L1.2 4.32L4.59 4.05L6 1Z"
        fill="#FFE500"
        stroke="#FFE500"
        strokeWidth="0.8"
      />
    </svg>
  );
}

function ProductBadge({ label }: { label: string }) {
  return (
    <div className="absolute left-2.5 top-2.5 rounded-full bg-brand-yellow px-2 py-0.5">
      <span className="whitespace-nowrap text-[11px] font-black leading-4 text-brand-dark">
        {label}
      </span>
    </div>
  );
}

interface ProductListCardProps {
  product: ProductGridItem;
}

export function ProductListCard({ product }: ProductListCardProps) {
  const {
    category,
    name,
    badge,
    originalPrice,
    price,
    rating,
    reviews,
    image,
  } = product;

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={{
            pathname: `/produtos/${product.id}`,
            query: image ? { img: image } : undefined,
          }}
          aria-label={`Ver produto ${name}`}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
        >
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-bg-light p-2">
            <ProductBadge label={badge} />
            {image ? (
              <ImageWithSkeleton
                src={image}
                alt={name}
                fill
                sizes="96px"
                imageClassName="object-contain p-1.5"
                fallback={<ProductImageFallback className="h-full w-full" />}
              />
            ) : (
              <ProductImageFallback className="absolute inset-0" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs text-text-muted">{category}</p>
            <h3 className="mt-0.5 line-clamp-2 text-sm font-black leading-5 text-brand-dark group-hover:underline">
              {name}
            </h3>
            <div className="mt-1.5 flex items-center gap-1">
              <StarIcon />
              <span className="text-xs font-medium text-text-secondary">
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-text-muted">({reviews})</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-base font-black text-brand-dark">
                R$ {price.toFixed(2).replace(".", ",")}
              </span>
              <span className="text-xs text-text-muted line-through">
                R$ {originalPrice.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </Link>

        <div className="sm:pl-4">
          <ProductListCartControls
            product={{
              id: product.id,
              category,
              name,
              image,
              price,
              originalPrice,
            }}
          />
        </div>
      </div>
    </article>
  );
}
