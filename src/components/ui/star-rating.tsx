import { StarIcon } from "./icons";

interface StarRatingProps {
  rating: number;
  count: number;
}

export function StarRating({ rating, count }: StarRatingProps) {
  const filledCount = Math.round(rating);

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} de 5 estrelas, ${count} avaliações`}
    >
      <div className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} filled={i < filledCount} />
        ))}
      </div>
      <span className="text-xs leading-4 text-text-muted">({count})</span>
    </div>
  );
}
