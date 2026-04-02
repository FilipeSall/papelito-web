export function FlashSaleBadge() {
  return (
    <div className="flex items-center gap-2 px-4 h-9 bg-brand-yellow rounded-[14px]">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M11 2L4 11H10L9 18L16 9H10L11 2Z"
          fill="#231F20"
          stroke="#231F20"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-black text-sm leading-5 tracking-[-0.150391px] uppercase text-brand-dark whitespace-nowrap">
        Oferta Relâmpago
      </span>
    </div>
  );
}
