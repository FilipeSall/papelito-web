import { StatusBadge, type StatusBadgeTone } from "@/components/layout/operational-panel";
import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";

export const vendorStatusLabel: Record<VendorOrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  aguardando_estoque: "Aguardando análise de estoque",
  aguardando_envio: "Aguardando envio",
  cancelado: "Cancelado",
  cancelamento_solicitado: "Estorno em andamento",
  em_separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  estornado: "Estornado",
};

const vendorStatusTone: Record<VendorOrderStatus, StatusBadgeTone> = {
  aguardando_pagamento: "warning",
  aguardando_estoque: "warning",
  aguardando_envio: "default",
  cancelado: "critical",
  cancelamento_solicitado: "critical",
  em_separacao: "warning",
  enviado: "default",
  entregue: "success",
  estornado: "default",
};

export function VendorOrderStatusBadge({ status }: { status: VendorOrderStatus }) {
  return <StatusBadge label={vendorStatusLabel[status]} tone={vendorStatusTone[status]} />;
}
