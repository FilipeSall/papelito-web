import Link from "next/link";
import type { StepStatus } from "./checkout-types";

const statusClasses = {
  completed: {
    circle: "bg-brand-yellow text-brand-dark",
    label: "text-white/70",
  },
  active: {
    circle: "bg-white text-brand-dark",
    label: "text-white font-medium",
  },
  upcoming: {
    circle: "bg-white/15 text-white/40",
    label: "text-white/40",
  },
} as const;

const CIRCLE_BASE =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition";
const LABEL_BASE = "text-sm tracking-[-0.1504px] transition";

function StepMark({ index, status }: { index: number; status: StepStatus }) {
  if (status !== "completed") return <>{index}</>;

  return (
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
  );
}

export function CheckoutStep({
  index,
  label,
  status,
  href = null,
  lockedHint,
}: {
  index: number;
  label: string;
  status: StepStatus;
  href?: string | null;
  lockedHint?: string;
}) {
  const classes = statusClasses[status];
  const content = (
    <>
      <span className={`${CIRCLE_BASE} ${classes.circle}`}>
        <StepMark index={index} status={status} />
      </span>
      <span className={`${LABEL_BASE} ${classes.label}`}>{label}</span>
    </>
  );

  if (status === "active") {
    return (
      <span
        aria-current="step"
        className="inline-flex items-center gap-2 rounded-full py-1 pr-2"
      >
        {content}
      </span>
    );
  }

  if (!href) {
    return (
      <span
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-full py-1 pr-2"
        title={lockedHint}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      className="group inline-flex items-center gap-2 rounded-full py-1 pr-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
      href={href}
    >
      <span
        className={`${CIRCLE_BASE} ${classes.circle} group-hover:ring-2 group-hover:ring-brand-yellow group-hover:ring-offset-2 group-hover:ring-offset-brand-dark`}
      >
        <StepMark index={index} status={status} />
      </span>
      <span className={`${LABEL_BASE} ${classes.label} group-hover:text-white group-hover:underline group-hover:underline-offset-4`}>
        {label}
      </span>
    </Link>
  );
}
