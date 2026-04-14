export interface CartProductInput {
  id: string;
  name: string;
  category?: string;
  image?: string;
  price: number;
  originalPrice?: number;
}

export interface CartItem extends CartProductInput {
  quantity: number;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  totalItems: number;
  amountToFreeShipping: number;
  hasFreeShipping: boolean;
  couponCode: string | null;
}
