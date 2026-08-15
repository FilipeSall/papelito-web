import { forwardRef } from "react";

type RevendedorTextInputProps = React.ComponentPropsWithoutRef<"input"> & {
  error?: string;
  prefixContent?: React.ReactNode;
  tone?: "light" | "dark";
};

/**
 * Campo base de texto com suporte a prefixo e estados de erro visuais.
 */
export const RevendedorTextInput = forwardRef<
  HTMLInputElement,
  RevendedorTextInputProps
>(function RevendedorTextInput(
  { className = "", error, prefixContent, tone = "light", ...props },
  ref,
) {
  const disabledClass = props.disabled
    ? "cursor-not-allowed opacity-50"
    : "";
  const borderClass =
    tone === "dark"
      ? error
        ? "border-red-400 focus:border-red-400 focus:ring-red-400/40"
        : "border-white/20 focus:border-brand-yellow focus:ring-brand-yellow"
      : error
        ? "border-red-400 focus:border-red-500"
        : "border-[#E5E7EB] focus:border-brand-yellow";

  const containerClass =
    tone === "dark"
      ? "bg-white/10 text-white"
      : "bg-white text-brand-dark";

  const inputClass =
    tone === "dark"
      ? "text-white placeholder:text-white/30"
      : "text-brand-dark placeholder:text-[rgba(35,31,32,0.5)]";

  const prefixClass = tone === "dark" ? "text-white/50" : "text-text-muted";

  return (
    <div
      className={`flex h-11.5 items-center rounded-3.5 border px-4 transition ${containerClass} ${borderClass} ${disabledClass} ${className}`.trim()}
    >
      {prefixContent ? (
        <span className={`mr-2 text-sm ${prefixClass}`}>{prefixContent}</span>
      ) : null}
      <input
        ref={ref}
        className={`w-full border-0 bg-transparent text-sm tracking-[-0.1504px] outline-none disabled:cursor-not-allowed ${inputClass}`}
        {...props}
      />
    </div>
  );
});
