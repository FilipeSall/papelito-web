import type { StepStatus } from "./checkout-types";

const statusClasses = {
  completed: {
    circle: "bg-brand-yellow text-brand-dark",
    label: "text-white/40",
  },
  active: {
    circle: "bg-white text-brand-dark",
    label: "text-white font-medium",
  },
  upcoming: {
    circle: "bg-white/20 text-white/40",
    label: "text-white/40",
  },
} as const;

export function CheckoutStep({
  index,
  label,
  status,
}: {
  index: number;
  label: string;
  status: StepStatus;
}) {
  const isCompleted = status === "completed";

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${statusClasses[status].circle}`}
      >
        {isCompleted ? (
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
          index
        )}
      </span>
      <span className={`text-sm tracking-[-0.1504px] ${statusClasses[status].label}`}>
        {label}
      </span>
    </div>
  );
}
