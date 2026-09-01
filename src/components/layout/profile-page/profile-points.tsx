type ProfilePointsProps = {
  points: number;
};

/**
 * Pontos de fidelidade do comprador, com a estrela amarela da marca.
 */
export function ProfilePoints({ points }: ProfilePointsProps) {
  const formattedPoints = points.toLocaleString("pt-BR");

  return (
    <span className="inline-flex h-6 items-center gap-1.5 border-2 border-brand-yellow/45 px-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-brand-yellow">
      <svg
        aria-hidden
        className="h-3 w-3"
        fill="currentColor"
        viewBox="0 0 12 12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 0L7.34708 4.1459H11.7063L8.17963 6.7082L9.52671 10.8541L6 8.2918L2.47329 10.8541L3.82037 6.7082L0.293661 4.1459H4.65292L6 0Z" />
      </svg>
      {formattedPoints} pontos
    </span>
  );
}
