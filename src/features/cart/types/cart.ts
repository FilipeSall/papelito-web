export interface CartProductInput {
  id: string;
  name: string;
  category?: string;
  image?: string;
  price: number;
  originalPrice?: number;
}

export interface CartVendor {
  vendorId: number;
  vendorName: string;
  city?: string;
  state?: string;
  distanceKm?: number;
  leadTimeDays?: number;
}

export interface ResolvedCartProductInput extends CartProductInput, CartVendor {
}

export interface CartItem extends ResolvedCartProductInput {
  quantity: number;
}

export interface CartVendorGroup extends CartVendor {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  totalItems: number;
  vendorGroups: CartVendorGroup[];
  amountToFreeShipping: number;
  hasFreeShipping: boolean;
  couponCode: string | null;
}
