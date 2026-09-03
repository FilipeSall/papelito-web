"use client";

import {
  ArrowRight,
  CircleCheck,
  CircleDashed,
  Clock,
  ExternalLink,
  EyeOff,
  FileText,
  PackageX,
  Tag,
} from "lucide-react";

import { ProductImageFallback } from "@/components/ui";
import type { AdminProduct } from "@/lib/server/admin-products";

import { formatDateTimeLabel } from "../../../formatters";
import {
  EmptyResult,
  FOCUS_RING,
  InlineAlert,
  ResultButtonRow,
  ResultFrame,
  StatusChip,
  type StatusShape,
} from "../../../primitives";
import { findPromotionTag, formatMoney, isPromotionActive } from "../helpers";

import { ProductsPagination } from "./products-pagination";

const PRODUCT_STATUS: Record<string, StatusShape> = {
  publish: { icon: CircleCheck, label: "Publicado", tone: "positive" },
  draft: { icon: FileText, label: "Rascunho", tone: "pending" },
  pending: { icon: Clock, label: "Pendente", tone: "pending" },
  private: { icon: EyeOff, label: "Privado", tone: "neutral" },
};

/** Só produto publicado tem página em `/produtos/[id]`; rascunho e privado respondem 404. */
function isPublished(status: string) {
  return status.trim().toLowerCase() === "publish";
}

function ProductStatusChip({ status }: { status: string }) {
  const shape = PRODUCT_STATUS[status.trim().toLowerCase()] ?? {
    icon: CircleDashed,
    label: status || "—",
    tone: "neutral" as const,
  };

  return <StatusChip {...shape} />;
}

function Thumbnail({ product }: { product: AdminProduct }) {
  const image = product.images[0];

  return (
    <span className="inline-flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden border-2 border-[#1a1a1a] bg-white">
      {image?.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={image.alt || product.name}
          className="h-full w-full object-cover"
          src={image.src}
        />
      ) : (
        <ProductImageFallback className="h-full w-full" />
      )}
    </span>
  );
}

function Classification({ product }: { product: AdminProduct }) {
  if (product.categories.length === 0) {
    return (
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#c0392b]">
        sem categoria · fora da vitrine
      </p>
    );
  }

  const subcategories = (product.subcategories ?? []).map((subcategory) => subcategory.name);

  return (
    <div className="flex items-start gap-2">
      <ArrowRight
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1a1a]/35"
        strokeWidth={2.4}
      />
      <div className="min-w-0">
        <p className="truncate font-bold text-[#231f20]">{product.categories[0].name}</p>
        <p className="mt-0.5 truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
          {subcategories.length > 0 ? subcategories.join(" · ") : "sem subcategoria"}
        </p>
      </div>
    </div>
  );
}

type ProductsListProps = {
  isLoading: boolean;
  issues: string[];
  onSelectProduct: (product: AdminProduct) => void;
  onChangePage: (nextPage: number) => void;
  onChangePerPage: (nextPerPage: number) => void;
  page: number;
  perPage: number;
  products: AdminProduct[];
  totalProducts: number;
  totalPages: number;
};

export function ProductsList({
  isLoading,
  issues,
  onChangePage,
  onChangePerPage,
  onSelectProduct,
  page,
  perPage,
  products,
  totalProducts,
  totalPages,
}: ProductsListProps) {
  // Erro de API não pode virar estado vazio: "nenhum produto" e "não consegui ler o catálogo"
  // levam o administrador a conclusões opostas.
  if (issues.length > 0) {
    return <InlineAlert tone="critical">{issues.join(" · ")}</InlineAlert>;
  }

  if (products.length === 0) {
    return (
      <EmptyResult
        body={
          isLoading
            ? "Buscando produtos no catálogo."
            : "Ajuste a busca, a situação ou os filtros adicionais para encontrar outros produtos."
        }
        title={isLoading ? "Carregando" : "Nenhum produto neste recorte"}
      />
    );
  }

  const promotionTag = findPromotionTag(
    products
      .flatMap((product) => product.tags)
      .filter((tag, index, tags) => tags.findIndex((candidate) => candidate.id === tag.id) === index),
  );

  return (
    <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <ResultFrame
        footer={
          <ProductsPagination
            isLoading={isLoading}
            onChangePage={onChangePage}
            onChangePerPage={onChangePerPage}
            page={page}
            perPage={perPage}
            totalPages={Math.max(totalPages, 1)}
            totalProducts={totalProducts}
          />
        }
        summary={`${totalProducts} produto${totalProducts === 1 ? "" : "s"} neste recorte`}
      >
        {products.map((product) => {
          const promotionActive = isPromotionActive(product, promotionTag?.id);
          const promotionScheduled =
            !promotionActive && Boolean(product.dateOnSaleFrom || product.dateOnSaleTo);

          return (
            <ResultButtonRow
              ariaLabel={`Editar ${product.name}`}
              key={product.id}
              lead={
                <div className="flex items-center gap-3">
                  <Thumbnail product={product} />
                  <div className="min-w-0">
                    <p className="truncate font-black uppercase tracking-tight text-[#1a1a1a]">
                      {product.name}
                    </p>
                    <p className="truncate text-xs text-[#231f20]/60">
                      {product.sku ? `SKU ${product.sku}` : "sem SKU"} · editado em{" "}
                      {formatDateTimeLabel(product.dateModified)}
                    </p>
                  </div>
                </div>
              }
              meta={<Classification product={product} />}
              onOpen={() => onSelectProduct(product)}
              trailing={
                <>
                  <span className="text-right">
                    <span className="block font-black tabular-nums text-[#1a1a1a]">
                      {formatMoney(product.salePrice || product.regularPrice || product.price)}
                    </span>
                    {product.salePrice ? (
                      <span className="block text-xs tabular-nums text-[#231f20]/50 line-through">
                        {formatMoney(product.regularPrice || product.price)}
                      </span>
                    ) : null}
                  </span>

                  {promotionActive || promotionScheduled ? (
                    <StatusChip
                      compact
                      icon={promotionActive ? Tag : Clock}
                      label={promotionActive ? "Promoção" : "Agendada"}
                      tone={promotionActive ? "positive" : "pending"}
                    />
                  ) : null}

                  {product.stockStatus === "outofstock" ? (
                    <StatusChip compact icon={PackageX} label="Sem estoque" tone="critical" />
                  ) : null}

                  <ProductStatusChip status={product.status} />

                  {isPublished(product.status) ? (
                    <a
                      aria-label={`Abrir ${product.name} na loja`}
                      className={[
                        "relative z-10 inline-flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a]/25 text-[#1a1a1a]/55 transition hover:border-[#1a1a1a] hover:bg-brand-yellow hover:text-[#1a1a1a]",
                        FOCUS_RING,
                      ].join(" ")}
                      href={`/produtos/${product.id}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                    </a>
                  ) : null}
                </>
              }
            />
          );
        })}
      </ResultFrame>
    </div>
  );
}
