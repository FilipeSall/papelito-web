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
    <section className="flex h-full flex-col border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div className="h-2 w-full bg-brand-yellow" />
      <header className="flex items-center justify-between border-b-2 border-[#1a1a1a] p-4">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-[#1a1a1a]" strokeWidth={2} />
          <h2 className="text-[15px] font-black uppercase tracking-[0.05em] text-[#1a1a1a]">
            Produtos Selecionados
          </h2>
        </div>
        <span className="bg-[#1a1a1a] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-brand-yellow">
          {products.length} {products.length === 1 ? "item" : "itens"}
        </span>
      </header>

      <div className="flex-1 bg-[#faf8f2] p-4">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#1a1a1a] bg-white py-10 text-[#1a1a1a]/50">
            <ShoppingBasket className="mb-2 h-12 w-12 opacity-40" strokeWidth={1.5} />
            <p className="text-sm font-medium leading-5">Nenhum produto selecionado para a oferta.</p>
            <p className="mt-1 text-[13px] leading-4.5">
              Use a busca ao lado para adicionar itens.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden border-2 border-[#1a1a1a] bg-white">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-[#1a1a1a] bg-[#1a1a1a] text-[10px] font-black uppercase tracking-widest text-brand-yellow">
                  <th className="p-2 font-black">Produto</th>
                  <th className="p-2 text-right font-black">Original</th>
                  <th className="p-2 text-right font-black">Oferta</th>
                  <th className="w-16 p-2 text-center font-black">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]/10 text-[13px] leading-4.5 text-[#1a1a1a]">
                {products.map((product) => (
                  <tr key={product.productId} className="transition-colors hover:bg-[#faf8f2]">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-[#1a1a1a]/20 bg-[#faf8f2]">
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
                              className="h-5 w-5 text-[#1a1a1a]/30"
                              strokeWidth={1.75}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-[#1a1a1a]">
                            {product.name}
                          </p>
                          <p className="text-[12px] leading-4 text-text-secondary">
                            SKU: {product.sku || "—"}
                            {" · "}
                            {product.category}
                          </p>
                          {!product.hasImage ? (
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#c0392b]">
                              <ImageOff className="h-3 w-3" strokeWidth={2} /> sem imagem
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-right text-[13px] text-text-secondary line-through">
                      {formatBRL(product.originalPrice)}
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[13px] font-bold text-[#1a1a1a]">
                          {formatBRL(product.price)}
                        </span>
                        {product.discount > 0 ? (
                          <span className="bg-brand-yellow px-1 text-[10px] font-black leading-4 text-[#1a1a1a]">
                            -{product.discount}%
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        aria-label={`Remover ${product.name}`}
                        className="cursor-pointer border border-[#c0392b] p-1 text-[#c0392b] transition-colors hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={disabled}
                        onClick={() => onRemove(product.productId)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
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
