export interface FlashSaleProduct {
  id: string;
  /** Categoria do produto (ex: "Seda") */
  category: string;
  name: string;
  /** Rótulo do badge de categoria no card */
  badge: string;
  /** Percentual de desconto (ex: 24 → "-24%") */
  discount: number;
  originalPrice: number;
  price: number;
  /** Nota de 0 a 5 */
  rating: number;
  reviews: number;
  /** Caminho relativo da imagem em /public */
  image: string;
  /** Aplica borda amarela e sombra elevada no card */
  featured?: boolean;
}

// TODO: Substituir por requisição ao backend — GET /api/promotions/flash-sale
// O endpoint deve retornar a data de término da promoção para calcular o countdown.
/** Tempo inicial do contador regressivo em segundos: 12 h 19 m 34 s */
export const FLASH_SALE_INITIAL_SECONDS = 12 * 3600 + 19 * 60 + 34;

// TODO: Substituir por requisição ao backend — GET /api/products?featured=flash-sale
// Os dados mockados abaixo devem ser carregados dinamicamente via API/GraphQL.
export const FLASH_SALE_PRODUCTS: FlashSaleProduct[] = [
  {
    id: "flash-1",
    category: "Seda",
    name: "Alfafa King Size",
    badge: "Mais Vendido",
    discount: 24,
    originalPrice: 16.9,
    price: 12.9,
    rating: 3.5,
    reviews: 234,
    image: "/images/products/Image (Alfafa King Size).png",
  },
  {
    id: "flash-2",
    category: "Seda",
    name: "Hemp King Size",
    badge: "Orgânico",
    discount: 21,
    originalPrice: 18.9,
    price: 14.9,
    rating: 3.5,
    reviews: 312,
    image: "/images/products/Image (Hemp King Size).png",
    featured: true,
  },
  {
    id: "flash-3",
    category: "Seda",
    name: "Tradicional Slim",
    badge: "Clássico",
    discount: 25,
    originalPrice: 11.9,
    price: 8.9,
    rating: 3.5,
    reviews: 521,
    image: "/images/products/Image (Tradicional Slim).png",
  },
  {
    id: "flash-4",
    category: "Seda",
    name: "Insane Brown",
    badge: "Premium",
    discount: 20,
    originalPrice: 19.9,
    price: 15.9,
    rating: 3.5,
    reviews: 203,
    image: "/images/products/Image (Insane Brown).png",
  },
];
