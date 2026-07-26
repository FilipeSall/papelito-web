interface NewNotificationToastProps {
  visible: boolean;
}

function BellIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 3.5a4.5 4.5 0 0 0-4.5 4.5c0 3.5-1.5 4.5-1.5 4.5h12s-1.5-1-1.5-4.5A4.5 4.5 0 0 0 10 3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M11.3 15a1.5 1.5 0 0 1-2.6 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function NewNotificationToast({ visible }: NewNotificationToastProps) {
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed right-4 top-4 z-70 w-[min(24rem,calc(100vw-2rem))] transition-all duration-250 ease-out will-change-transform md:right-8 md:top-8 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
      }`}
      role="status"
    >
      <div className="relative overflow-hidden rounded-2xl border border-brand-yellow/60 bg-brand-dark p-4 shadow-[0_14px_35px_rgba(35,31,32,0.36)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand-yellow" />
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-dark">
            <BellIcon />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.55px] text-brand-yellow">
              Notificações
            </p>
            <p className="mt-1 text-sm leading-5 text-white/90">
              Você recebeu uma nova notificação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
