"use client";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import { ProductImageFallback } from "@/components/ui";
import type { AdminProduct } from "@/lib/server/admin-products";

import { formatDateTimeLabel } from "../../../formatters";
import { FramedPanel } from "../../../primitives";
import { findPromotionTag, formatMoney, formatTermLabel, isPromotionActive } from "../helpers";

const TABLE_HEADERS = ["produto", "status", "preço", "promoção", "atualizado"];

function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);

  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items: Array<number | string> = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`);
    }

    items.push(page);
  });

  return items;
}

type ProductsListProps = {
  isLoading: boolean;
  onSelectProduct: (product: AdminProduct) => void;
  onChangePage: (nextPage: number) => void;
  page: number;
  perPage: number;
  products: AdminProduct[];
  totalProducts: number;
  totalPages: number;
};

export function ProductsList({
  isLoading,
  onChangePage,
  onSelectProduct,
  page,
  perPage,
  products,
  totalProducts,
  totalPages,
}: ProductsListProps) {
  const promotionTag = findPromotionTag(
    products.flatMap((product) => product.tags).filter((tag, index, tags) => {
      return tags.findIndex((candidate) => candidate.id === tag.id) === index;
    }),
  );
  const pageItems = buildPageItems(page, Math.max(totalPages, 1));
  const startIndex = totalProducts === 0 ? 0 : (page - 1) * perPage + 1;
  const endIndex = totalProducts === 0 ? 0 : Math.min(page * perPage, totalProducts);

  return (
    <FramedPanel className="overflow-hidden pb-2">
      <div className="flex flex-col gap-3 border-b border-[#231f20]/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
            Catálogo
          </p>
          <p className="mt-1 text-sm text-[#231f20]/66">
            {totalProducts > 0
              ? `${totalProducts} produtos encontrados para os filtros aplicados.`
              : "Nenhum produto encontrado para os filtros aplicados."}
          </p>
        </div>
        <div className="inline-flex min-h-10 items-center rounded-full border border-[#231f20]/14 bg-white/82 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#231f20]/64">
          página {page} de {Math.max(totalPages, 1)}
        </div>
      </div>

      <div className="max-h-[72rem] overflow-auto">
        {products.length === 0 ? (
          <div className="px-5 py-8 text-sm leading-6 text-[#231f20]/68">
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto px-2 pt-2">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead className="sticky top-0 z-10 bg-[#fbf7ef]">
                <tr>
                  {TABLE_HEADERS.map((header) => (
                    <th
                      className="border-b border-[#231f20]/12 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48"
                      key={header}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    className="cursor-pointer transition hover:bg-[#fff6da]"
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                  >
                    <td className="border-b border-[#231f20]/8 px-4 py-3 align-top">
                      <div className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] border border-[#d6ccb6] bg-white">
                          {product.images[0]?.src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={product.images[0].alt || product.name}
                              className="h-full w-full object-cover"
                              src={product.images[0].src}
                            />
                          ) : (
                            <ProductImageFallback className="h-full w-full" />
                          )}
                        </div>
                        <div className="min-w-0 pt-1">
                          <p className="line-clamp-2 text-[1.02rem] font-semibold leading-6 text-[#231f20]">
                            {product.name}
                          </p>
                          <p className="mt-1 truncate text-sm text-[#70695d]">
                            SKU: {product.sku || "não informado"} · slug:{" "}
                            {product.slug || "não informado"}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#a0947b]">
                            {product.categories.length > 0
                              ? product.categories
                                  .slice(0, 2)
                                  .map((category) =>
                                    formatTermLabel(category, product.categories),
                                  )
                                  .join(" · ")
                              : "Sem categoria"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#231f20]/8 px-4 py-3 align-top">
                      <ProductStatusBadge label={product.status} />
                    </td>
                    <td className="border-b border-[#231f20]/8 px-4 py-3 align-top">
                      <p className="text-base font-semibold text-[#231f20]">
                        {formatMoney(product.salePrice || product.regularPrice || product.price)}
                      </p>
                      {product.salePrice ? (
                        <p className="mt-1 text-xs text-[#8d8678] line-through">
                          {formatMoney(product.regularPrice || product.price)}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-[#8d8678]">preço base</p>
                      )}
                    </td>
                    <td className="border-b border-[#231f20]/8 px-4 py-3 align-top">
                      <PromotionBadge
                        active={isPromotionActive(product, promotionTag?.id)}
                        hasSchedule={Boolean(product.dateOnSaleFrom || product.dateOnSaleTo)}
                      />
                    </td>
                    <td className="border-b border-[#231f20]/8 px-4 py-3 align-top text-sm text-[#231f20]/62">
                      <span className="block font-medium text-[#5d574d]">
                        {formatDateTimeLabel(product.dateModified)}
                      </span>
                      <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-[#9a958d]">
                        última edição
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[#231f20]/64">
          Mostrando {startIndex}-{endIndex} de {totalProducts} produtos, ordenados pelos filtros aplicados.
        </p>
        <div className="flex items-center gap-3">
          <button
            aria-label="Página anterior"
            className="inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-[12px] border border-[#231f20]/16 bg-white px-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#231f20]/72 hover:border-[#231f20]/32 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page <= 1 || isLoading}
            onClick={() => onChangePage(page - 1)}
            type="button"
          >
            ‹
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d8678]">
              Página
            </span>
            <CheckoutCustomSelect
              disabled={isLoading || totalPages <= 1}
              label=""
              labelClassName="hidden"
              listClassName="bottom-full z-[60] mt-0 mb-2"
              options={Array.from({ length: Math.max(totalPages, 1) }, (_, index) => ({
                label: String(index + 1),
                value: String(index + 1),
              }))}
              placeholder="Página"
              triggerClassName="h-9 min-h-9 rounded-[12px] border-[#231f20]/16 px-3 py-0 font-semibold text-[#231f20]/72 focus:border-[#231f20]"
              value={String(page)}
              onChange={(nextValue) => onChangePage(Number(nextValue))}
            />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {pageItems.map((item) =>
              typeof item === "number" ? (
                <button
                  aria-current={item === page ? "page" : undefined}
                  className={[
                    "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-[12px] px-3 text-sm font-semibold transition",
                    item === page
                      ? "border-2 border-[#231f20] bg-[#231f20] text-[#ffe500]"
                      : "border border-[#231f20]/16 bg-white text-[#231f20]/72 hover:border-[#231f20]/32",
                  ].join(" ")}
                  disabled={isLoading}
                  key={item}
                  onClick={() => onChangePage(item)}
                  type="button"
                >
                  {item}
                </button>
              ) : (
                <span
                  className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-[#231f20]/48"
                  key={item}
                >
                  …
                </span>
              ),
            )}
          </div>
          <button
            aria-label="Próxima página"
            className="inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-[12px] border-2 border-[#231f20] bg-[#231f20] px-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#ffe500] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page >= totalPages || isLoading}
            onClick={() => onChangePage(page + 1)}
            type="button"
          >
            ›
          </button>
        </div>
      </div>
    </FramedPanel>
  );
}

function PromotionBadge({
  active,
  hasSchedule,
}: {
  active: boolean;
  hasSchedule: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
        active
          ? "border-[#d8b458] bg-[linear-gradient(180deg,#fff5cb_0%,#ffe8a3_100%)] text-[#7a4b00]"
          : hasSchedule
            ? "border-[#d5c08a] bg-[linear-gradient(180deg,#f8f0da_0%,#eee2bf_100%)] text-[#6f5e2f]"
            : "border-[#ddd3bc] bg-[linear-gradient(180deg,#fbf7ef_0%,#f2eadb_100%)] text-[#847d70]",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "h-2.5 w-2.5 rounded-full ring-2 ring-white/70",
          active ? "bg-[#c88b00]" : hasSchedule ? "bg-[#a88a42]" : "bg-[#b5aa97]",
        ].join(" ")}
      />
      {active ? "Ativa" : hasSchedule ? "Agendada" : "Sem campanha"}
    </span>
  );
}

function ProductStatusBadge({ label }: { label: string }) {
  const normalized = label.trim().toLowerCase();
  const config =
    normalized === "publish"
      ? {
          dotClassName: "bg-[#2f7a41]",
          label: "Publicado",
          toneClassName:
            "border-[#b7d0bc] bg-[linear-gradient(180deg,#f6fbf5_0%,#e8f3e7_100%)] text-[#244a2d]",
        }
      : normalized === "draft"
        ? {
            dotClassName: "bg-[#8e7741]",
            label: "Rascunho",
            toneClassName:
              "border-[#d8ca9c] bg-[linear-gradient(180deg,#fbf5df_0%,#f1e6bf_100%)] text-[#604f21]",
          }
        : normalized === "pending"
          ? {
              dotClassName: "bg-[#9a6b2f]",
              label: "Pendente",
              toneClassName:
                "border-[#debf93] bg-[linear-gradient(180deg,#fff4e1_0%,#f7e1bf_100%)] text-[#7d4f19]",
            }
          : normalized === "private"
            ? {
                dotClassName: "bg-[#49433a]",
                label: "Privado",
                toneClassName:
                  "border-[#d6ccba] bg-[linear-gradient(180deg,#f7f2e8_0%,#ece4d5_100%)] text-[#4f473b]",
              }
            : {
                dotClassName: "bg-[#8f8678]",
                label: label || "Status",
                toneClassName:
                  "border-[#ddd3bc] bg-[linear-gradient(180deg,#fbf7ef_0%,#f1eadd_100%)] text-[#6f6758]",
              };

  return (
    <span
      className={[
        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
        config.toneClassName,
      ].join(" ")}
    >
      <span
        aria-hidden
        className={`h-2.5 w-2.5 rounded-full ${config.dotClassName} ring-2 ring-white/70`}
      />
      {config.label}
    </span>
  );
}
