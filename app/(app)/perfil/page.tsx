import { redirect } from "next/navigation";

import { OrdersList } from "@/components/layout/profile-page";
import { getProfileOrders } from "@/features/orders";

type ProfilePageProps = {
  searchParams?: Promise<{ page?: string | string[] }> | { page?: string | string[] };
};

function readSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePage(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentPage = normalizePage(readSingleParam(resolvedSearchParams.page));
  const orders = await getProfileOrders({ page: currentPage, perPage: 10 });

  if (orders.total > 0 && currentPage > orders.totalPages) {
    redirect(orders.totalPages <= 1 ? "/perfil" : `/perfil?page=${orders.totalPages}`);
  }

  return (
    <OrdersList
      currentPage={orders.page}
      orders={orders.items}
      totalPages={orders.totalPages}
    />
  );
}
