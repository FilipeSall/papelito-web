/**
 * Produto para a seção "Recém Chegados".
 */
export interface NewArrivalProduct {
  id: string;
  name: string;
  originalPrice: number;
  price: number;
  discount: number;
  /**
   * Caminho da imagem. Se não fornecido, exibe fallback genérico.
   */
  image?: string;
}

/**
 * Lista de produtos recém-chegados exibidos em carousel horizontal.
 *
 * Nove produtos em cards compactos com scroll horizontal.
 */
// TODO: Substituir por requisição ao backend — GET /api/products?sort=newest&limit=9
// Os dados mockados abaixo devem ser carregados dinamicamente via API/GraphQL.
export const NEW_ARRIVAL_PRODUCTS: NewArrivalProduct[] = [
  {
    id: "new-1",
    name: "Alfafa King Size",
    originalPrice: 16.9,
    price: 12.9,
    discount: 24,
    image: "/images/products/Image (Alfafa King Size).png",
  },
  {
    id: "new-2",
    name: "Brown King Size",
    originalPrice: 14.9,
    price: 11.9,
    discount: 20,
    image: "/images/products/Image (Brown King Size).png",
  },
  {
    id: "new-3",
    name: "Hemp King Size",
    originalPrice: 18.9,
    price: 14.9,
    discount: 21,
    image: "/images/products/Image (Hemp King Size).png",
  },
  {
    id: "new-4",
    name: "Pink Queen Size",
    originalPrice: 17.9,
    price: 13.9,
    discount: 22,
    image: "/images/products/Image (Pink Queen Size).png",
  },
  {
    id: "new-5",
    name: "Tradicional Slim",
    originalPrice: 11.9,
    price: 8.9,
    discount: 25,
    image: "/images/products/Image (Tradicional Slim).png",
  },
  {
    id: "new-6",
    name: "Piteira Tradicional",
    originalPrice: 9.9,
    price: 6.9,
    discount: 30,
    image: "/images/products/Image (Piteira Tradicional).png",
  },
  {
    id: "new-7",
    name: "Bag Tradicional",
    originalPrice: 24.9,
    price: 19.9,
    discount: 20,
    image: "/images/products/Image (Bag Tradicional).png",
  },
  {
    id: "new-8",
    name: "Insane Brown",
    originalPrice: 19.9,
    price: 15.9,
    discount: 20,
    image: "/images/products/Image (Insane Brown).png",
  },
  {
    id: "new-9",
    name: "Livreto Hemp",
    originalPrice: 21.9,
    price: 16.9,
    discount: 23,
    // Imagem não disponível - exibe fallback
  },
];
