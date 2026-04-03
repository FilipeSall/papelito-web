import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import {
  Order,
  OrdersList,
  ProfileContent,
  ProfileHero,
} from "@/components/layout/profile-page";

// TODO: Obter pedidos do usuário via API
const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "#PB-001234",
    status: "delivered",
    date: "10 Mar 2026",
    itemsCount: 3,
    total: 45.8,
  },
  {
    id: "2",
    orderNumber: "#PB-001189",
    status: "in_transit",
    date: "02 Mar 2026",
    itemsCount: 2,
    total: 28.9,
  },
  {
    id: "3",
    orderNumber: "#PB-001100",
    status: "delivered",
    date: "20 Fev 2026",
    itemsCount: 5,
    total: 67.5,
  },
];

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/entrar");

  const { name, email, image } = session.user;

  return (
    <>
      <ProfileHero
        email={email ?? ""}
        image={image}
        name={name ?? ""}
      />
      <ProfileContent>
        <OrdersList orders={mockOrders} />
      </ProfileContent>
    </>
  );
}
