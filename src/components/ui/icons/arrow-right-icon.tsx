interface ArrowRightIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function ArrowRightIcon({
  className,
  size = 24,
  strokeWidth = 2,
}: ArrowRightIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
