export type FeedbackState = {
  actionType?: "pagarme-bank-account-support";
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
  live = true,
  onAction,
}: {
  className?: string;
  feedback: FeedbackState | null;
  live?: boolean;
  onAction?: (actionType: NonNullable<FeedbackState["actionType"]>) => void;
}) {
  if (!feedback) return null;

  const tone = feedback.error
    ? "border-2 border-[#c0392b] bg-[#f7e6e2] text-[#7a3428] shadow-[4px_4px_0px_#c0392b]"
    : "border-2 border-[#1a1a1a] bg-brand-yellow/35 text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]";
  const details = feedback.details?.filter(Boolean) ?? [];

  return (
    <div
      className={`px-4 py-3 text-sm ${tone} ${className}`}
      role={live ? (feedback.error ? "alert" : "status") : undefined}
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
      {feedback.actionType && feedback.actionLabel && onAction ? (
        <button
          className="mt-3 inline-flex cursor-pointer text-[11px] font-black uppercase tracking-[0.14em] underline"
          onClick={() => onAction(feedback.actionType as NonNullable<FeedbackState["actionType"]>)}
          type="button"
        >
          {feedback.actionLabel}
        </button>
      ) : feedback.actionHref && feedback.actionLabel ? (
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
