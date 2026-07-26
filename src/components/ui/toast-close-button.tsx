interface ToastCloseButtonProps {
  onClose: () => void;
  tone?: "yellow" | "danger";
}

function CloseIcon() {
  return (
    <svg
      aria-hidden
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.5 5.5L14.5 14.5M14.5 5.5L5.5 14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

const TONE_CLASSNAME = {
  yellow: "text-white/60 hover:bg-brand-yellow hover:text-brand-dark",
  danger: "text-white/60 hover:bg-red-400 hover:text-brand-dark",
} as const;

export function ToastCloseButton({ onClose, tone = "yellow" }: ToastCloseButtonProps) {
  return (
    <button
      aria-label="Fechar notificação"
      className={`-mr-1 -mt-1 ml-auto inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow ${TONE_CLASSNAME[tone]}`}
      onClick={onClose}
      type="button"
    >
      <CloseIcon />
    </button>
  );
}
