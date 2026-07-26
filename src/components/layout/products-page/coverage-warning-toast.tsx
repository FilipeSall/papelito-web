import { ToastCloseButton } from "@/components/ui/toast-close-button";

interface CoverageWarningToastProps {
  onClose: () => void;
  visible: boolean;
}

function AlertIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 6.5V11M10 14H10.01M3.5 16.5H16.5L10 4L3.5 16.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function CoverageWarningToast({ onClose, visible }: CoverageWarningToastProps) {
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed right-4 top-24 z-70 w-[min(24rem,calc(100vw-2rem))] transition-all duration-250 ease-out will-change-transform md:right-8 md:top-28 ${
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-8 opacity-0"
      }`}
      role="status"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-red-300/60 bg-brand-dark p-4 shadow-[0_14px_35px_rgba(35,31,32,0.36)] ${
          visible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-red-400" />
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-400 text-brand-dark">
            <AlertIcon />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.55px] text-red-300">
              Cobertura por CEP
            </p>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/90">
              Não foi possível validar a disponibilidade por CEP agora.
            </p>
          </div>
          <ToastCloseButton onClose={onClose} tone="danger" />
        </div>
      </div>
    </div>
  );
}
