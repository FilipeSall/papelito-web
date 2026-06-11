import Image from "next/image";

type LogoSpinnerLoaderProps = {
  className?: string;
  label?: string;
  message?: string;
  size?: "sm" | "md";
  layout?: "inline" | "stacked";
};

export function LogoSpinnerLoader({
  className = "",
  label = "Carregando",
  message,
  size = "md",
  layout = "stacked",
}: LogoSpinnerLoaderProps) {
  const isSmall = size === "sm";
  const isInline = layout === "inline";
  const hasLabel = label.trim().length > 0;

  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className={`flex items-center justify-center overflow-hidden ${className}`.trim()}
      role="status"
    >
      <div
        className={`flex ${
          isInline
            ? "items-center gap-3 text-left"
            : "flex-col items-center gap-6 text-center"
        }`}
      >
        <div className={`relative ${isSmall ? "size-11" : "size-28"}`}>
          <div
            className={`absolute inset-0 animate-spin rounded-full border-brand-yellow/25 border-t-brand-yellow ${
              isSmall ? "border-2" : "border-[3px]"
            }`}
          />
          <div
            className={`absolute flex items-center justify-center rounded-full bg-brand-yellow ${
              isSmall ? "inset-1 shadow-lg" : "inset-2 shadow-2xl"
            }`}
          >
            <Image
              alt="Papelito"
              height={isSmall ? 18 : 42}
              priority
              src="/images/logo.svg"
              width={isSmall ? 30 : 70}
            />
          </div>
        </div>

        <div className={isInline ? "space-y-1" : "space-y-2"}>
          {hasLabel ? (
            <p
              className={`font-black uppercase text-brand-dark/55 ${
                isSmall ? "text-[10px] tracking-[0.2em]" : "text-[11px] tracking-[0.24em]"
              }`}
            >
              {label}
            </p>
          ) : null}
          {message ? (
            <p className="text-sm text-brand-dark/70">
              {message}
            </p>
          ) : null}
        </div>
      </div>
      <span className="sr-only">{message ?? (hasLabel ? `${label}…` : "Carregando…")}</span>
    </section>
  );
}
