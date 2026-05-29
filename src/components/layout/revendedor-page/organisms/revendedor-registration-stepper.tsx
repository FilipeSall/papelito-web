type RevendedorRegistrationStepperProps = {
  currentStep: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
};

const steps: Array<{ label: string; step: 1 | 2 | 3 }> = [
  { step: 1, label: "Dados iniciais" },
  { step: 2, label: "Localização" },
  { step: 3, label: "Pagamento" },
];

export function RevendedorRegistrationStepper({
  currentStep,
  onStepChange,
}: RevendedorRegistrationStepperProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((item, index) => {
        const status =
          item.step < currentStep ? "completed" : item.step === currentStep ? "active" : "upcoming";

        return (
          <div className="flex items-center gap-2" key={item.step}>
            <button
              className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-left transition hover:bg-white/6"
              onClick={() => onStepChange(item.step)}
              type="button"
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                  status === "completed"
                    ? "bg-brand-yellow text-brand-dark"
                    : status === "active"
                      ? "bg-white text-brand-dark"
                      : "bg-white/20 text-white/40"
                }`}
              >
                {status === "completed" ? (
                  <svg
                    aria-hidden
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.4"
                    />
                  </svg>
                ) : (
                  item.step
                )}
              </span>
              <span
                className={`text-sm ${
                  status === "active"
                    ? "font-medium text-white"
                    : status === "completed"
                      ? "text-white/75"
                      : "text-white/40"
                }`}
              >
                {item.label}
              </span>
            </button>

            {index < steps.length - 1 ? (
              <span className="text-white/30" aria-hidden>
                /
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
