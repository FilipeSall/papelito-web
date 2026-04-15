import { ChevronRightIcon } from "@/components/ui/icons";
import { CheckoutStep } from "./checkout-step";
import type { StepStatus } from "./checkout-types";

function getStepStatus(step: number, currentStep: number): StepStatus {
  if (step < currentStep) return "completed";
  if (step === currentStep) return "active";
  return "upcoming";
}

export function CheckoutStepNav({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-white">
      <CheckoutStep index={1} label="Endereco" status={getStepStatus(1, currentStep)} />
      <ChevronRightIcon className="h-3.5 w-3.5 text-white/35" />
      <CheckoutStep index={2} label="Pagamento" status={getStepStatus(2, currentStep)} />
      <ChevronRightIcon className="h-3.5 w-3.5 text-white/35" />
      <CheckoutStep index={3} label="Revisao" status={getStepStatus(3, currentStep)} />
    </div>
  );
}
