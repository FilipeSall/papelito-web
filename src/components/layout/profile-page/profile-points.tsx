type ProfilePointsProps = {
  points: number;
};

/**
 * Exibição dos pontos de fidelidade do usuário.
 * Mostra ícone de estrela amarela seguido da quantidade de pontos.
 */
export function ProfilePoints({ points }: ProfilePointsProps) {
  const formattedPoints = points.toLocaleString("pt-BR");

  return (
    <div className="flex items-center gap-1">
      <svg
        aria-hidden
        className="h-3 w-3 text-brand-yellow"
        fill="currentColor"
        viewBox="0 0 12 12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 0L7.34708 4.1459H11.7063L8.17963 6.7082L9.52671 10.8541L6 8.2918L2.47329 10.8541L3.82037 6.7082L0.293661 4.1459H4.65292L6 0Z" />
      </svg>
      <span className="text-xs font-normal text-brand-yellow">
        {formattedPoints} pontos
      </span>
    </div>
  );
}
