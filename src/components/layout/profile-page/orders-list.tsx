import Link from "next/link";

import { Order, OrderCard } from "./order-card";
import { ProfileEmptyShoppingState } from "./profile-empty-shopping-state";

type OrdersListProps = {
  orders: Order[];
  currentPage: number;
  totalPages: number;
};

function buildProfileHref(page: number) {
  return page <= 1 ? "/perfil" : `/perfil?page=${page}`;
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ] as const;
};

/**
 * Lista de pedidos do usuário.
 * Exibe título e cards de pedidos.
 */
export function OrdersList({ orders, currentPage, totalPages }: OrdersListProps) {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <section className="flex flex-1 flex-col gap-4">
      <h2 className="text-xl font-black uppercase tracking-[-0.45px] text-brand-dark">
        Meus Pedidos
      </h2>

      <div className="flex flex-col gap-4">
        {orders.length === 0 ? (
          <ProfileEmptyShoppingState
            ctaLabel="Ir as compras"
            description="Seu histórico de pedidos vai aparecer aqui assim que você fechar a primeira compra. Explore os produtos e aproveite para montar seu carrinho."
            title="Você ainda não fez seu primeiro pedido"
          />
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Paginação de pedidos"
          className="mt-2 flex flex-wrap items-center justify-center gap-2"
        >
          <Link
            aria-disabled={!hasPrevious}
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors ${
              hasPrevious
                ? "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
                : "pointer-events-none border-gray-100 bg-gray-50 text-gray-300"
            }`}
            href={hasPrevious ? buildProfileHref(currentPage - 1) : "#"}
          >
            Anterior
          </Link>

          {paginationItems.map((item, index) => {
            if (item === "...") {
              return (
                <span
                  className="inline-flex h-10 min-w-8 items-center justify-center text-sm font-semibold text-text-muted"
                  key={`ellipsis-${index}`}
                >
                  ...
                </span>
              );
            }

            const isActive = item === currentPage;
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border text-sm font-black transition-colors ${
                  isActive
                    ? "border-brand-dark bg-brand-dark text-white shadow-[0_6px_14px_rgba(35,31,32,0.18)]"
                    : "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
                }`}
                href={buildProfileHref(item)}
                key={item}
              >
                {item}
              </Link>
            );
          })}

          <Link
            aria-disabled={!hasNext}
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors ${
              hasNext
                ? "border-gray-200 bg-white text-brand-dark hover:border-brand-dark"
                : "pointer-events-none border-gray-100 bg-gray-50 text-gray-300"
            }`}
            href={hasNext ? buildProfileHref(currentPage + 1) : "#"}
          >
            Próxima
          </Link>
        </nav>
      ) : null}
    </section>
  );
}
