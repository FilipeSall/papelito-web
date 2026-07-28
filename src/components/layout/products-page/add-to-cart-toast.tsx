import Link from "next/link";
import type { AddToCartEventDetail } from "@/components/ui/add-to-cart-button";
import { ToastCloseButton } from "@/components/ui/toast-close-button";

interface AddToCartToastProps {
  detail: AddToCartEventDetail;
  onClose: () => void;
  visible: boolean;
  placement?: "fixed-top-right" | "anchor-top";
  className?: string;
}

function CheckIcon({ tone }: { tone: NonNullable<AddToCartEventDetail["tone"]> }) {
  if (tone !== "success") {
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

  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 10.5L8.2 13.7L15 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

const TONE_STYLES = {
  success: {
    border: "border-brand-yellow/40",
    bar: "bg-brand-yellow",
    icon: "bg-brand-yellow text-brand-dark",
    label: "text-brand-yellow",
    title: "Carrinho atualizado",
  },
  warning: {
    border: "border-[#F59E0B]/60",
    bar: "bg-[#F59E0B]",
    icon: "bg-[#F59E0B] text-brand-dark",
    label: "text-[#FCD34D]",
    title: "Carrinho mantido",
  },
  error: {
    border: "border-red-300/60",
    bar: "bg-red-400",
    icon: "bg-red-400 text-brand-dark",
    label: "text-red-300",
    title: "Não foi possível adicionar",
  },
} as const;

export function AddToCartToast({
  detail,
  onClose,
  visible,
  placement = "fixed-top-right",
  className = "",
}: AddToCartToastProps) {
  const tone = detail.tone ?? "success";
  const styles = TONE_STYLES[tone];
  const title = detail.title ?? styles.title;
  const body =
    detail.message ??
    (detail.productName
      ? `${detail.productName} foi adicionado ao carrinho.`
      : "Produto adicionado ao carrinho.");
  const placementClassName =
    placement === "anchor-top"
      ? `absolute bottom-full left-1/2 mb-3 z-30 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 transition-all duration-250 ease-out will-change-transform ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        }`
      : `fixed right-4 top-24 z-70 w-[min(24rem,calc(100vw-2rem))] transition-all duration-250 ease-out will-change-transform md:right-8 md:top-28 ${
          visible
            ? "translate-x-0 opacity-100"
            : "translate-x-8 opacity-0"
        }`;

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none ${placementClassName} ${className}`.trim()}
      role="status"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-brand-dark p-4 shadow-[0_14px_35px_rgba(35,31,32,0.36)] ${
          visible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${styles.bar}`} />
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${styles.icon}`}>
            <CheckIcon tone={tone} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-black uppercase tracking-[0.55px] ${styles.label}`}>
              {title}
            </p>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/90">
              {detail.productName && !detail.message ? (
                <>
                  <span className="font-black text-white">{detail.productName}</span>{" "}
                  foi adicionado ao carrinho.
                </>
              ) : (
                body
              )}
            </p>
            {detail.href ? (
              <Link
                className="mt-2 inline-flex text-xs font-black uppercase tracking-[0.35px] text-white underline decoration-white/50 underline-offset-4 transition hover:text-brand-yellow"
                href={detail.href}
              >
                {detail.actionLabel ?? "Abrir"}
              </Link>
            ) : null}
          </div>
          <ToastCloseButton onClose={onClose} tone={tone === "error" ? "danger" : "yellow"} />
        </div>
      </div>
    </div>
  );
}
