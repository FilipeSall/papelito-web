import { Order, OrderCard } from "./order-card";
import { ProfileEmptyShoppingState } from "./profile-empty-shopping-state";

type OrdersListProps = {
  orders: Order[];
};

/**
 * Lista de pedidos do usuário.
 * Exibe título e cards de pedidos.
 */
export function OrdersList({ orders }: OrdersListProps) {
  return (
    <section className="flex flex-1 flex-col gap-4">
      <h2 className="text-xl font-black uppercase tracking-[-0.45px] text-brand-dark">
        Meus Pedidos
      </h2>

      <div className="flex flex-col gap-4">
        {orders.length === 0 ? (
          <ProfileEmptyShoppingState
            ctaLabel="Ir as compras"
            description="Seu historico de pedidos vai aparecer aqui assim que voce fechar a primeira compra. Explore os produtos e aproveite para montar seu carrinho."
            title="Voce ainda nao fez seu primeiro pedido"
          />
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </section>
  );
}
