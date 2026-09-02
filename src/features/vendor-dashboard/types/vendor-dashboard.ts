import type { SalesSeriesInterval, SalesSeriesPoint } from "@/lib/sales-series";

export type VendorRevenuePoint = SalesSeriesPoint;

export type VendorTopProduct = {
  productId: number;
  name: string;
  qty: number;
  revenue: number;
};

export type VendorDashboardSnapshot = {
  averageTicket: number;
  awaitingPaymentOrders: number;
  grossRevenue: number;
  ordersCount: number;
  pendingOrders: number;
  previousGrossRevenue: number | null;
  period: {
    from: string;
    interval: SalesSeriesInterval;
    to: string;
  };
  revenueSeries: VendorRevenuePoint[];
  topProducts: VendorTopProduct[];
};
