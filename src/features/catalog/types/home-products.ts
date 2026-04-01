export interface HomeProductCard {
  id: string;
  category: string;
  name: string;
  badge: string;
  discount: number;
  originalPrice: number;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  featured?: boolean;
}

export interface HomeNewArrivalProduct {
  id: string;
  name: string;
  originalPrice: number;
  price: number;
  discount: number;
  image?: string;
}

export interface HomeProductsPayload {
  flashSaleProducts: HomeProductCard[];
  bestSellerProducts: HomeProductCard[];
  newArrivalProducts: HomeNewArrivalProduct[];
}
