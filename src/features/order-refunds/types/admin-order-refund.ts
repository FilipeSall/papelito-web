export type AdminOrderRefundsFilter = "overdue" | "pending" | "all";

export type AdminOrderRefund = {
  amountCents: number;
  attempts: number;
  customerId: number;
  id: number;
  lastError: string;
  mode: "api" | "manual";
  orderId: number;
  overdue: boolean;
  reason: string;
  receiptNumber: string;
  refundDueAt: string;
  requestedAt: string;
  settledAt: string;
  source: string;
  status: "processando" | "reembolsado" | "falhou" | "manual_pendente";
  vendorId: number;
};

/** `unavailable` separa "fila vazia" de "leitura falhou" — a Papelito não pode concluir que não há cobrança a fazer. */
export type AdminOrderRefundsSnapshot = {
  filter: AdminOrderRefundsFilter;
  items: AdminOrderRefund[];
  unavailable: boolean;
};
