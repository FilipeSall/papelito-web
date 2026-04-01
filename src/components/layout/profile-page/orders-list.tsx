import { Order, OrderCard } from "./order-card";

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
          <div className="flex items-center justify-center rounded-2xl bg-white px-6 py-12 shadow-sm">
            <p className="text-sm text-gray-500">Você ainda não tem pedidos.</p>
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </section>
  );
}
