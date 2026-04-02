interface ChevronLeftIconProps {
  className?: string;
}

export function ChevronLeftIcon({ className }: ChevronLeftIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
