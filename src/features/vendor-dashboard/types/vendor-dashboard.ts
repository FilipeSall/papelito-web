export type VendorRevenuePoint = {
  label: string;
  value: number;
};

export type VendorTopProduct = {
  productId: number;
  name: string;
  qty: number;
  revenue: number;
};

export type VendorDashboardSnapshot = {
  averageTicket: number;
  grossRevenue: number;
  ordersCount: number;
  pendingOrders: number;
  period: {
    from: string;
    interval: "day" | "week" | "month";
    to: string;
  };
  revenueSeries: VendorRevenuePoint[];
  topProducts: VendorTopProduct[];
};
