export type FeedbackState = { error: boolean; message: string };

export function FeedbackBanner({
  className = "",
  feedback,
}: {
  className?: string;
  feedback: FeedbackState | null;
}) {
  if (!feedback) return null;

  const tone = feedback.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700";

  return (
    <p
      className={`rounded-[12px] px-4 py-3 text-sm ${tone} ${className}`}
      role={feedback.error ? "alert" : "status"}
    >
      {feedback.message}
    </p>
  );
}
