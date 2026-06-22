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

  const tone = feedback.error
    ? "border-2 border-[#c0392b] bg-[#f7e6e2] text-[#7a3428] shadow-[4px_4px_0px_#c0392b]"
    : "border-2 border-[#1a1a1a] bg-brand-yellow/35 text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]";
  const details = feedback.details?.filter(Boolean) ?? [];

  return (
    <div
      className={`px-4 py-3 text-sm ${tone} ${className}`}
      role={feedback.error ? "alert" : "status"}
    >
      {feedback.title ? (
        <p className="text-[11px] font-black uppercase tracking-[0.18em]">{feedback.title}</p>
      ) : null}
      <p className="font-semibold">{feedback.message}</p>
      {details.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] font-medium">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      {feedback.hint ? <p className="mt-2 text-[13px] font-medium opacity-85">{feedback.hint}</p> : null}
      {feedback.actionHref && feedback.actionLabel ? (
        <a
          className="mt-3 inline-flex text-[11px] font-black uppercase tracking-[0.14em] underline"
          href={feedback.actionHref}
        >
          {feedback.actionLabel}
        </a>
      ) : null}
    </div>
  );
}
