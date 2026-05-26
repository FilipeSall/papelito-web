import { StatusBadge } from "@/components/layout/operational-panel";
import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";

export const vendorStatusLabel: Record<VendorOrderStatus, string> = {
  aguardando_envio: "Aguardando envio",
  cancelado: "Cancelado",
  em_separacao: "Em separacao",
  enviado: "Enviado",
  entregue: "Entregue",
};

export function VendorOrderStatusBadge({ status }: { status: VendorOrderStatus }) {
  return <StatusBadge label={vendorStatusLabel[status]} />;
}
