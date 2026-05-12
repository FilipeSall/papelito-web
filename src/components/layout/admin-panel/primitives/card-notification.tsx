type CardNotificationProps = {
  issues: string[];
  tone?: "info" | "warning";
};

function BellIcon() {
  return (
    <svg
      aria-hidden
      fill="none"
      height={16}
      viewBox="0 0 24 24"
      width={16}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function CardNotification({ issues, tone = "warning" }: CardNotificationProps) {
  if (issues.length === 0) {
    return null;
  }

  const dotClassName =
    tone === "warning"
      ? "bg-[#d97a4d] ring-2 ring-[#fbf7ef]"
      : "bg-[#5d8df0] ring-2 ring-[#fbf7ef]";

  return (
    <div className="group relative inline-flex">
      <button
        aria-label={`${issues.length} notificacao${issues.length > 1 ? "es" : ""} sobre este painel`}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#231f20]/14 bg-white/82 text-[#231f20]/72 transition hover:border-[#231f20]/32 hover:text-[#231f20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#231f20]/24"
        type="button"
      >
        <BellIcon />
        <span
          aria-hidden
          className={`absolute -right-0.5 -top-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full ${dotClassName}`}
        />
      </button>
      <div
        role="tooltip"
        className="pointer-events-none invisible absolute right-0 top-full z-30 mt-2 w-max max-w-[320px] -translate-y-1 rounded-[12px] border border-[#231f20]/14 bg-[#fbf7ef] p-3 text-left text-xs leading-5 text-[#231f20]/84 opacity-0 shadow-[4px_4px_0_rgba(35,31,32,0.12)] transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#231f20]/52">
          {issues.length === 1 ? "1 notificacao" : `${issues.length} notificacoes`}
        </p>
        <ul className="space-y-1.5">
          {issues.map((issue) => (
            <li key={issue} className="whitespace-normal">
              {issue}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
