interface StarIconProps {
  filled: boolean;
}

export function StarIcon({ filled }: StarIconProps) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 1L6.18 3.62L9 3.93L6.9 5.93L7.45 8.73L5 7.36L2.55 8.73L3.1 5.93L1 3.93L3.82 3.62L5 1Z"
        fill={filled ? "#FFE500" : "none"}
        stroke={filled ? "#FFE500" : "#D1D5DC"}
        strokeWidth="0.833333"
      />
    </svg>
  );
}
