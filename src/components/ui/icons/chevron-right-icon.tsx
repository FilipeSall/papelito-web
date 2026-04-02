interface ChevronRightIconProps {
  className?: string;
}

export function ChevronRightIcon({ className }: ChevronRightIconProps) {
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
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
