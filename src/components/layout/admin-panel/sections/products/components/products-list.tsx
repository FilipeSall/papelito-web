"use client";

import { ProductImageFallback } from "@/components/ui";
import type { AdminProduct } from "@/lib/server/admin-products";

import { formatDateTimeLabel } from "../../../formatters";
import { Panel, StatusBadge } from "../../../primitives";
import { formatMoney, formatTermLabel } from "../helpers";

const TABLE_HEADERS = ["produto", "status", "preco", "categorias", "atualizado"];

type ProductsListProps = {
  isLoading: boolean;
  onSelectProduct: (product: AdminProduct) => void;
  onChangePage: (nextPage: number) => void;
  page: number;
  products: AdminProduct[];
  totalPages: number;
};

export function ProductsList({
  isLoading,
  onChangePage,
  onSelectProduct,
  page,
  products,
  totalPages,
}: ProductsListProps) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#231f20]/10 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
          Catalogo
        </p>
        <div className="flex gap-2">
          <button
            className="cursor-pointer rounded-[10px] border border-[#231f20]/18 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page <= 1 || isLoading}
            onClick={() => onChangePage(page - 1)}
            type="button"
          >
            Anterior
          </button>
          <button
            className="cursor-pointer rounded-[10px] border border-[#231f20]/18 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page >= totalPages || isLoading}
            onClick={() => onChangePage(page + 1)}
            type="button"
          >
            Proxima
          </button>
        </div>
      </div>

      <div className="max-h-[72rem] overflow-auto">
        {products.length === 0 ? (
          <div className="px-5 py-12 text-sm text-[#231f20]/62">
            Nenhum produto encontrado.
          </div>
        ) : (
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead className="sticky top-0 z-10 bg-[#fbf7ef]">
              <tr>
                {TABLE_HEADERS.map((header) => (
                  <th
                    className="border-b border-[#231f20]/12 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/48"
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
                  className="cursor-pointer transition hover:bg-[#fff8c5]/70"
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                >
                  <td className="border-b border-[#231f20]/8 px-4 py-3 align-top">
                    <div className="flex gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border border-[#231f20]/12 bg-white">
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
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold text-[#231f20]">
                          {product.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#231f20]/54">
                          {product.sku || "SKU vazio"} · {product.slug || "sem slug"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-[#231f20]/8 px-4 py-3 align-top">
                    <StatusBadge label={product.status} />
                  </td>
                  <td className="border-b border-[#231f20]/8 px-4 py-3 align-top text-sm font-semibold">
                    {formatMoney(product.salePrice || product.regularPrice || product.price)}
                    {product.salePrice ? (
                      <p className="mt-1 text-xs font-normal text-[#9a3f2f]">promo ativa</p>
                    ) : null}
                  </td>
                  <td className="border-b border-[#231f20]/8 px-4 py-3 align-top text-sm text-[#231f20]/72">
                    {product.categories.length > 0
                      ? product.categories
                          .slice(0, 2)
                          .map((category) => formatTermLabel(category, product.categories))
                          .join(", ")
                      : "Sem categoria"}
                  </td>
                  <td className="border-b border-[#231f20]/8 px-4 py-3 align-top text-sm text-[#231f20]/62">
                    {formatDateTimeLabel(product.dateModified)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
}
