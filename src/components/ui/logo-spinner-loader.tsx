import Image from "next/image";

type LogoSpinnerLoaderProps = {
  className?: string;
  label?: string;
  message?: string;
};

export function LogoSpinnerLoader({
  className = "",
  label = "Carregando",
  message,
}: LogoSpinnerLoaderProps) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className={`flex items-center justify-center overflow-hidden ${className}`.trim()}
      role="status"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative size-28">
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-brand-yellow/25 border-t-brand-yellow" />
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-brand-yellow shadow-2xl">
            <Image
              alt="Papelito"
              height={42}
              priority
              src="/images/logo.svg"
              width={70}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-dark/55">
            {label}
          </p>
          {message ? (
            <p className="text-sm text-brand-dark/70">
              {message}
            </p>
          ) : null}
        </div>
      </div>
      <span className="sr-only">Carregando…</span>
    </section>
  );
}
