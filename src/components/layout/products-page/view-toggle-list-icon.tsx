interface ListIconProps {
  active: boolean;
}

/**
 * Ícone de lista (list view).
 */
export function ViewToggleListIcon({ active }: ListIconProps) {
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
        y="3"
        width="16"
        height="4"
        rx="1"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
      <rect
        x="2"
        y="8"
        width="16"
        height="4"
        rx="1"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
      <rect
        x="2"
        y="13"
        width="16"
        height="4"
        rx="1"
        fill={active ? "#231F20" : "#9CA3AF"}
      />
    </svg>
  );
}
