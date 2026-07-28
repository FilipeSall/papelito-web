import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";

type StepStatus = VendorOrderStatus;
type StepState = "completed" | "active" | "upcoming";

const steps: Array<{ label: string; status: StepStatus }> = [
  { status: "aguardando_pagamento", label: "Pagamento" },
  { status: "aguardando_envio", label: "Aguardando envio" },
  { status: "em_separacao", label: "Separação" },
  { status: "enviado", label: "Enviado" },
  { status: "entregue", label: "Entregue" },
];

function stepIndex(status: VendorOrderStatus): number {
  return steps.findIndex((step) => step.status === status);
}

function CheckIcon() {
  return (
    <svg aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CancelledState({ reason }: { reason?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#d7b0aa] bg-[#f3e3df] px-5 py-4">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7a3428] text-[#f3e3df]">
        <svg aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.12em] text-[#7a3428]">Pedido cancelado</p>
        <p className="mt-1 text-sm text-[#7a3428]/80">
          {reason || "Este pedido foi cancelado e não avancara na esteira de envio."}
        </p>
      </div>
    </div>
  );
}

export function VendorOrderStatusStepper({
  status,
  cancelReason,
}: {
  status: VendorOrderStatus;
  cancelReason?: string;
}) {
  if (status === "cancelado") {
    return <CancelledState reason={cancelReason} />;
  }

  const currentIndex = stepIndex(status);

  return (
    <ol className="flex flex-col gap-0 md:flex-row md:items-start md:gap-0">
      {steps.map((step, index) => {
        const state: StepState =
          index < currentIndex ? "completed" : index === currentIndex ? "active" : "upcoming";
        const isLast = index === steps.length - 1;
        const connectorFilled = index < currentIndex;

        return (
          <li
            aria-current={state === "active" ? "step" : undefined}
            className="flex flex-1 gap-3 pt-7 md:flex-col md:items-center md:gap-0"
            key={step.status}
          >
            <div className="relative flex flex-col items-center md:w-full">
              {state === "active" ? (
                <span className="absolute -top-7 left-4.5 z-20 inline-flex -translate-x-1/2 rounded-full bg-brand-yellow px-2 py-0.5 text-[11px] font-black text-brand-dark md:left-1/2">
                  Atual
                </span>
              ) : null}
              {!isLast ? (
                <span
                  aria-hidden
                  className={`my-1 w-px flex-1 md:absolute md:top-4.5 md:left-1/2 md:my-0 md:h-px md:w-full ${
                    connectorFilled ? "bg-brand-yellow" : "bg-brand-dark/12"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${
                  state === "completed"
                    ? "bg-brand-yellow text-brand-dark"
                    : state === "active"
                      ? "bg-brand-dark text-brand-yellow"
                      : "bg-brand-dark/10 text-brand-dark/40"
                }`}
              >
                {state === "completed" ? <CheckIcon /> : index + 1}
              </span>
            </div>
            <div className="pb-4 md:mt-3 md:pb-0 md:text-center">
              <p
                className={`text-sm font-semibold ${
                  state === "upcoming" ? "text-brand-dark/40" : "text-brand-dark"
                }`}
              >
                {step.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
