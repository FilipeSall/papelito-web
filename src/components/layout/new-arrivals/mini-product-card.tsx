import Image from "next/image";
import { ProductImageFallback } from "@/components/ui";

interface MiniProductCardProps {
  /**
   * Nome do produto exibido abaixo da imagem.
   */
  name: string;
  /**
   * Preço original (riscado) do produto.
   */
  originalPrice: number;
  /**
   * Preço atual com desconto.
   */
  price: number;
  /**
   * Percentual de desconto (ex: 24 → "-24%").
   */
  discount: number;
  /**
   * Caminho da imagem do produto. Se não fornecido, exibe fallback.
   */
  image?: string;
}

/**
 * Ícone de carrinho para o botão "Adicionar".
 */
function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M6 6L5 3H2" />
    </svg>
  );
}

/**
 * Card compacto de produto para seções de carousel horizontal.
 *
 * Versão menor do ProductCard, otimizada para exibição em linha.
 * Apresenta imagem com badge de desconto, nome, preços e botão "Adicionar".
 *
 * @example
 * ```tsx
 * <MiniProductCard
 *   name="Alfafa King Size"
 *   originalPrice={16.90}
 *   price={12.90}
 *   discount={24}
 *   image="/images/products/Image (Alfafa King Size).png"
 * />
 * ```
 */
export function MiniProductCard({
  name,
  originalPrice,
  price,
  discount,
  image,
}: MiniProductCardProps) {
  const originalFormatted = originalPrice.toFixed(2).replace(".", ",");
  const priceFormatted = price.toFixed(2).replace(".", ",");

  const handleAddToCart = () => {
    // TODO: integrate with cart store
    console.log(`Adding ${name} to cart at R$ ${priceFormatted}`);
  };

  return (
    <div className="w-44 h-65.5 bg-white border border-[#F3F4F6] rounded-2xl shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col shrink-0">
      {/* Image container */}
      <div className="relative h-36 bg-bg-light">
        {image ? (
          <div className="absolute inset-x-0 top-4 h-28">
            <Image
              src={image}
              alt={name}
              fill
              className="object-contain"
              sizes="174px"
            />
          </div>
        ) : (
          <ProductImageFallback className="absolute inset-0 rounded-t-2xl" />
        )}

        {/* Discount badge */}
        <div className="absolute top-2 right-2 flex items-center px-1.5 py-0.5 bg-[#FB2C36] rounded-full">
          <span className="font-black text-xs leading-4 text-white">
            -{discount}%
          </span>
        </div>
      </div>

      {/* Info container */}
      <div className="flex-1 p-3 flex flex-col">
        <span className="font-black text-xs leading-4 text-brand-dark truncate">
          {name}
        </span>
        <span className="text-xs leading-4 text-text-muted line-through mt-0.5">
          R$ {originalFormatted}
        </span>
        <span className="font-black text-base leading-6 tracking-[-0.3125px] text-brand-dark">
          R$ {priceFormatted}
        </span>

        {/* Add to cart button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-auto flex items-center justify-center gap-1.5 w-full h-7 bg-brand-dark rounded-[10px] hover:opacity-80 transition-opacity"
        >
          <CartIcon className="size-3 text-white" />
          <span className="font-black text-xs leading-4 text-white">
            Adicionar
          </span>
        </button>
      </div>
    </div>
  );
}
