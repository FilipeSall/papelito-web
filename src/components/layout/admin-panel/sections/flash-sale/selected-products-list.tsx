import Image from "next/image";
import { ImageOff, ListChecks, ShoppingBasket, Trash2 } from "lucide-react";

import type { AdminFlashSaleProduct } from "@/lib/server/admin-flash-sale";
import { formatBRL } from "@/lib/format-currency";

type SelectedProductsListProps = {
  disabled?: boolean;
  onRemove: (productId: number) => void;
  products: AdminFlashSaleProduct[];
};

export function SelectedProductsList({
  disabled,
  onRemove,
  products,
}: SelectedProductsListProps) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#cec7aa] bg-white">
      <header className="flex items-center justify-between border-b border-[#cec7aa] p-4">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-[#6a5f00]" strokeWidth={2} />
          <h2 className="text-[18px] font-semibold leading-6 text-[#1e1c10]">
            Produtos Selecionados
          </h2>
        </div>
        <span className="rounded-lg bg-[#e9e2cf] px-2 py-1 text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#4b4731]">
          {products.length} {products.length === 1 ? "item" : "itens"}
        </span>
      </header>

      <div className="flex-1 bg-[#faf3df] p-4">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cec7aa] bg-white py-10 text-[#4b4731]">
            <ShoppingBasket className="mb-2 h-12 w-12 opacity-50" strokeWidth={1.5} />
            <p className="text-sm leading-5">Nenhum produto selecionado para a oferta.</p>
            <p className="mt-1 text-[13px] leading-[18px]">
              Use a busca ao lado para adicionar itens.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#cec7aa] bg-[#fff9ea]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#cec7aa] bg-[#e9e0e1] text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#4b4731]">
                  <th className="p-2 font-semibold">Produto</th>
                  <th className="p-2 text-right font-semibold">Preço Original</th>
                  <th className="p-2 text-right font-semibold">Preço Oferta</th>
                  <th className="w-16 p-2 text-center font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cec7aa] text-[13px] leading-[18px] text-[#1e1c10]">
                {products.map((product) => (
                  <tr key={product.productId} className="transition-colors hover:bg-[#e9e2cf]">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-[#cec7aa] bg-[#e9e2cf]">
                          {product.hasImage && product.image ? (
                            <Image
                              alt={product.name}
                              className="h-full w-full object-cover"
                              height={40}
                              src={product.image}
                              width={40}
                            />
                          ) : (
                            <ImageOff
                              className="h-5 w-5 text-[#a06b00]"
                              strokeWidth={1.75}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[#1e1c10]">
                            {product.name}
                          </p>
                          <p className="text-[12px] leading-4 text-[#4b4731]">
                            SKU: {product.sku || "—"}
                            {" · "}
                            {product.category}
                          </p>
                          {!product.hasImage ? (
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#a06b00]">
                              <ImageOff className="h-3 w-3" strokeWidth={2} /> sem imagem
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-right text-[13px] text-[#4b4731] line-through">
                      {formatBRL(product.originalPrice)}
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[13px] font-medium text-[#6a5f00]">
                          {formatBRL(product.price)}
                        </span>
                        {product.discount > 0 ? (
                          <span className="rounded bg-[#ffe500] px-1 text-[10px] font-bold leading-4 text-[#726600]">
                            -{product.discount}%
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        aria-label={`Remover ${product.name}`}
                        className="cursor-pointer rounded p-1 text-[#ba1a1a] transition-colors hover:bg-[#ffdad6] disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={disabled}
                        onClick={() => onRemove(product.productId)}
                        type="button"
                      >
                        <Trash2 className="h-5 w-5" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
