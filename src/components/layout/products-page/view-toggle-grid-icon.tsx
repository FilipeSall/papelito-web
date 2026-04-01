interface GridIconProps {
  active: boolean;
}

/**
 * Ícone de grade (grid view).
 */
export function ViewToggleGridIcon({ active }: GridIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="2"
        y="2"
        width="7"
        height="7"
        rx="1.5"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
      <rect
        x="11"
        y="2"
        width="7"
        height="7"
        rx="1.5"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
      <rect
        x="2"
        y="11"
        width="7"
        height="7"
        rx="1.5"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
      <rect
        x="11"
        y="11"
        width="7"
        height="7"
        rx="1.5"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
    </svg>
  );
}
