interface StarRatingProps {
  /** Nota de 0 a 5 (valores intermediários são arredondados) */
  rating: number;
  /** Total de avaliações exibido entre parênteses */
  count: number;
}

function StarIcon({ filled }: { filled: boolean }) {
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

/**
 * Exibição atômica de classificação por estrelas.
 *
 * Renderiza 5 ícones — preenchidos em amarelo até o valor arredondado
 * de `rating`, contornados em cinza para os demais — seguidos da
 * contagem de avaliações entre parênteses.
 */
export function StarRating({ rating, count }: StarRatingProps) {
  const filledCount = Math.round(rating);

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} filled={i < filledCount} />
        ))}
      </div>
      <span className="text-xs leading-4 text-text-muted">({count})</span>
    </div>
  );
}
