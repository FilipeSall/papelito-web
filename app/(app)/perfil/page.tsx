import {
  Order,
  OrdersList,
  ProfileContent,
  ProfileHero,
} from "@/components/layout/profile-page";

// TODO: Obter dados do usuário via API/context
const mockUser = {
  name: "João Silva",
  email: "joao.silva@email.com",
  badge: "MEMBRO PREMIUM",
  points: 1240,
};

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

export default function ProfilePage() {
  return (
    <>
      <ProfileHero
        badge={mockUser.badge}
        email={mockUser.email}
        name={mockUser.name}
        points={mockUser.points}
      />
      <ProfileContent>
        <OrdersList orders={mockOrders} />
      </ProfileContent>
    </>
  );
}
