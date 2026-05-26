import { OrdersList } from "@/components/layout/profile-page";
import { getProfileOrders } from "@/features/orders";

export default async function ProfilePage() {
  const orders = await getProfileOrders();

  return <OrdersList orders={orders} />;
}
