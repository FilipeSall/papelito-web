interface AddToCartToastProps {
  productName: string;
  visible: boolean;
}

function CheckIcon() {
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

export function AddToCartToast({ productName, visible }: AddToCartToastProps) {
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
      <div className="relative overflow-hidden rounded-2xl border border-brand-yellow/40 bg-brand-dark p-4 shadow-[0_14px_35px_rgba(35,31,32,0.36)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand-yellow" />
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-dark">
            <CheckIcon />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.55px] text-brand-yellow">
              Carrinho atualizado
            </p>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/90">
              <span className="font-black text-white">{productName}</span> foi
              adicionado ao carrinho.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
