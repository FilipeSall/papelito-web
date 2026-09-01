"use client";

import {
  CHECKOUT_STEP_ROUTES,
  useCheckoutStepAccess,
  type CheckoutStepNumber,
} from "@/features/checkout";
import { CheckoutStep } from "./checkout-step";
import type { StepStatus } from "./checkout-types";

const STEPS: { index: CheckoutStepNumber; label: string; lockedHint?: string }[] = [
  { index: 1, label: "Endereço" },
  {
    index: 2,
    label: "Pagamento",
    lockedHint: "Preencha o endereço e escolha o frete para liberar o pagamento.",
  },
  {
    index: 3,
    label: "Revisão",
    lockedHint: "Confirme os dados de pagamento para liberar a revisão.",
  },
];

function getStepStatus(step: number, currentStep: number): StepStatus {
  if (step < currentStep) return "completed";
  if (step === currentStep) return "active";
  return "upcoming";
}

export function CheckoutStepNav({ currentStep }: { currentStep: CheckoutStepNumber }) {
  const stepAccess = useCheckoutStepAccess();

  return (
    <nav aria-label="Etapas do checkout">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-white">
        {STEPS.map(({ index, label, lockedHint }) => {
          const status = getStepStatus(index, currentStep);
          const isReachable = index <= currentStep || stepAccess[index];

          return (
            <li className="inline-flex items-center gap-x-1" key={index}>
              {index > 1 ? (
                <span
                  aria-hidden
                  className={`mr-1 h-px w-6 rounded-full transition sm:w-10 ${
                    index <= currentStep ? "bg-brand-yellow/70" : "bg-white/20"
                  }`}
                />
              ) : null}

              <CheckoutStep
                href={isReachable ? CHECKOUT_STEP_ROUTES[index] : null}
                index={index}
                label={label}
                lockedHint={lockedHint}
                status={status}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
