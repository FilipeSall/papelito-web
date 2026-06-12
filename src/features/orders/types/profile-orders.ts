import type { Order } from "@/components/layout/profile-page/order-card";

export interface ProfileOrdersSnapshot {
  items: Order[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
