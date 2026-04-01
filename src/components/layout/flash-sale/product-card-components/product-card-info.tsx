import { AddToCartButton } from "../add-to-cart-button";
import { StarRating } from "../star-rating";
import { ProductPrice } from "./product-price";

interface ProductCardInfoProps {
  category: string;
  name: string;
  rating: number;
  reviews: number;
  originalPrice: number;
  price: number;
}

/**
 * Container molecular de informações do produto.
 *
 * Compõe a seção inferior do card com categoria, nome, classificação
 * por estrelas e preços. Inclui o botão "Adicionar ao carrinho" alinhado
 * à direita.
 */
export function ProductCardInfo({
  category,
  name,
  rating,
  reviews,
  originalPrice,
  price,
}: ProductCardInfoProps) {
  return (
    <div className="flex-1 px-4 pt-4 pb-4 flex flex-col">
      <span className="text-xs leading-4 text-text-muted">{category}</span>
      <span className="font-black text-sm leading-5 tracking-[-0.150391px] text-brand-dark mt-0.5">
        {name}
      </span>
      <div className="mt-1">
        <StarRating rating={rating} count={reviews} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <ProductPrice original={originalPrice} current={price} />
        <AddToCartButton />
      </div>
    </div>
  );
}
