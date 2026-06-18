export type FeedbackState = {
  actionHref?: string;
  actionLabel?: string;
  details?: string[];
  error: boolean;
  hint?: string;
  message: string;
  title?: string;
};

export function FeedbackBanner({
  className = "",
  feedback,
}: {
  className?: string;
  feedback: FeedbackState | null;
}) {
  if (!feedback) return null;

  const tone = feedback.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700";
  const details = feedback.details?.filter(Boolean) ?? [];

  return (
    <div
      className={`rounded-[12px] px-4 py-3 text-sm ${tone} ${className}`}
      role={feedback.error ? "alert" : "status"}
    >
      {feedback.title ? <p className="font-semibold">{feedback.title}</p> : null}
      <p>{feedback.message}</p>
      {details.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      {feedback.hint ? <p className="mt-2 text-[13px] opacity-85">{feedback.hint}</p> : null}
      {feedback.actionHref && feedback.actionLabel ? (
        <a className="mt-3 inline-flex font-semibold underline" href={feedback.actionHref}>
          {feedback.actionLabel}
        </a>
      ) : null}
    </div>
  );
}
