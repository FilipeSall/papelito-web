import { VendorOrderStatusStepper } from "@/components/layout/vendor-panel/vendor-order-status-stepper";
import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Verificação interna");

const statuses: VendorOrderStatus[] = [
  "aguardando_pagamento",
  "aguardando_envio",
  "em_separacao",
  "enviado",
  "entregue",
];

export default function VerifyStepperPage() {
  return (
    <div className="space-y-8 bg-bg-light p-10">
      {statuses.map((status) => (
        <div className="rounded-2xl border border-brand-dark/10 bg-white p-6" key={status}>
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48">
            status = {status}
          </p>
          <VendorOrderStatusStepper status={status} />
        </div>
      ))}
    </div>
  );
}
