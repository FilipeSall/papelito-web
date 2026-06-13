import { StatusBadge, type StatusBadgeTone } from "@/components/layout/operational-panel";
import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";

export const vendorStatusLabel: Record<VendorOrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  aguardando_envio: "Aguardando envio",
  cancelado: "Cancelado",
  em_separacao: "Em separacao",
  enviado: "Enviado",
  entregue: "Entregue",
};

const vendorStatusTone: Record<VendorOrderStatus, StatusBadgeTone> = {
  aguardando_pagamento: "warning",
  aguardando_envio: "default",
  cancelado: "critical",
  em_separacao: "warning",
  enviado: "default",
  entregue: "success",
};

export function VendorOrderStatusBadge({ status }: { status: VendorOrderStatus }) {
  return <StatusBadge label={vendorStatusLabel[status]} tone={vendorStatusTone[status]} />;
}
