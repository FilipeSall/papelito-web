import type { FlashSaleProduct } from "../flash-sale/constants";

/**
 * Tipo de produto para a seção Best Sellers.
 * Reutiliza a mesma estrutura do FlashSaleProduct para consistência.
 */
export type BestSellerProduct = FlashSaleProduct;

/**
 * Lista de produtos mais vendidos exibidos na seção "Nossos Produtos".
 *
 * Grid 4x2 com 8 produtos variados incluindo sedas, piteiras e acessórios.
 */
export const BEST_SELLER_PRODUCTS: BestSellerProduct[] = [
  {
    id: "best-1",
    category: "Seda",
    name: "Alfafa King Size",
    badge: "Mais Vendido",
    discount: 24,
    originalPrice: 16.9,
    price: 12.9,
    rating: 4.5,
    reviews: 234,
    image: "/images/products/Image (Alfafa King Size).png",
  },
  {
    id: "best-2",
    category: "Seda",
    name: "Brown King Size",
    badge: "Novo",
    discount: 20,
    originalPrice: 14.9,
    price: 11.9,
    rating: 4.5,
    reviews: 189,
    image: "/images/products/Image (Brown King Size).png",
  },
  {
    id: "best-3",
    category: "Seda",
    name: "Hemp King Size",
    badge: "Orgânico",
    discount: 21,
    originalPrice: 18.9,
    price: 14.9,
    rating: 4.5,
    reviews: 312,
    image: "/images/products/Image (Hemp King Size).png",
  },
  {
    id: "best-4",
    category: "Seda",
    name: "Pink Queen Size",
    badge: "Especial",
    discount: 22,
    originalPrice: 17.9,
    price: 13.9,
    rating: 4.5,
    reviews: 156,
    image: "/images/products/Image (Pink Queen Size).png",
  },
  {
    id: "best-5",
    category: "Seda",
    name: "Tradicional Slim",
    badge: "Clássico",
    discount: 25,
    originalPrice: 11.9,
    price: 8.9,
    rating: 4.5,
    reviews: 521,
    image: "/images/products/Image (Tradicional Slim).png",
  },
  {
    id: "best-6",
    category: "Piteira",
    name: "Piteira Tradicional",
    badge: "Essencial",
    discount: 30,
    originalPrice: 9.9,
    price: 6.9,
    rating: 4.5,
    reviews: 678,
    image: "/images/products/Image (Piteira Tradicional).png",
  },
  {
    id: "best-7",
    category: "Acessório",
    name: "Bag Tradicional",
    badge: "Kit",
    discount: 20,
    originalPrice: 24.9,
    price: 19.9,
    rating: 4.5,
    reviews: 98,
    image: "/images/products/Image (Bag Tradicional).png",
  },
  {
    id: "best-8",
    category: "Seda",
    name: "Insane Brown",
    badge: "Premium",
    discount: 20,
    originalPrice: 19.9,
    price: 15.9,
    rating: 4.5,
    reviews: 203,
    image: "/images/products/Image (Insane Brown).png",
  },
];
