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
  promotionContext?: string;
  featured?: boolean;
}

export interface HomeFlashSaleCampaign {
  title: string;
  slug: string;
  status: string;
  startsAt: string;
  endsAt: string;
  productIds: number[];
  label: string;
  supportingText: string;
  products: HomeProductCard[];
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
  flashSaleCampaign: HomeFlashSaleCampaign | null;
  bestSellerProducts: HomeProductCard[];
  newArrivalProducts: HomeNewArrivalProduct[];
}
