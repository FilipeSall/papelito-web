import Link from "next/link";

import { Order, OrderCard } from "./order-card";
import { ProfileEmptyShoppingState } from "./profile-empty-shopping-state";
import { ProfilePageTitle } from "./profile-panel";

type OrdersListProps = {
  orders: Order[];
  currentPage: number;
  totalPages: number;
};

const pageLinkClass =
  "inline-flex h-11 min-w-11 items-center justify-center border-2 px-3 text-xs font-black uppercase tracking-[0.14em] transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]";

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
}

/**
 * Lista paginada dos pedidos da conta, com o estado vazio de primeira compra.
 */
export function OrdersList({ orders, currentPage, totalPages }: OrdersListProps) {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <section className="flex flex-1 flex-col gap-7">
      <ProfilePageTitle
        description={
          orders.length === 0
            ? "Cada compra fechada aparece aqui com situação, rastreio e recibo."
            : "Acompanhe a situação de cada compra, o rastreio e o recibo."
        }
        title="Meus pedidos"
      />

      <div className="flex flex-col gap-6">
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
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <Link
            aria-disabled={!hasPrevious}
            className={`${pageLinkClass} ${
              hasPrevious
                ? "border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a]"
                : "pointer-events-none border-[#1a1a1a]/25 bg-transparent text-[#1a1a1a]/35"
            }`}
            href={hasPrevious ? buildProfileHref(currentPage - 1) : "#"}
          >
            Anterior
          </Link>

          {paginationItems.map((item, index) => {
            if (item === "...") {
              return (
                <span
                  aria-hidden
                  className="inline-flex h-11 min-w-8 items-center justify-center text-sm font-black text-[#1a1a1a]/45"
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
                className={`${pageLinkClass} tabular-nums ${
                  isActive
                    ? "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]"
                    : "border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a]"
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
            className={`${pageLinkClass} ${
              hasNext
                ? "border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a]"
                : "pointer-events-none border-[#1a1a1a]/25 bg-transparent text-[#1a1a1a]/35"
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
