import { CartPageContent } from "@/components/layout/cart-page/cart-page-content";
import { getFreeShippingThreshold } from "@/features/shipping/services/get-free-shipping-threshold";

export default async function CarrinhoPage() {
  const threshold = await getFreeShippingThreshold();
  return <CartPageContent freeShippingMinimumCents={threshold?.minimumOrderCents ?? null} />;
}
