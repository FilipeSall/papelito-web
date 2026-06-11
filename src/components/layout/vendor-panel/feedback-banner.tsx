export type FeedbackState = { error: boolean; message: string; details?: string[] };

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
      <p>{feedback.message}</p>
      {details.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
