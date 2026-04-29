import { forwardRef } from "react";

type RevendedorTextInputProps = React.ComponentPropsWithoutRef<"input"> & {
  error?: string;
  prefixContent?: React.ReactNode;
};

/**
 * Campo base de texto com suporte a prefixo e estados de erro visuais.
 */
export const RevendedorTextInput = forwardRef<
  HTMLInputElement,
  RevendedorTextInputProps
>(function RevendedorTextInput(
  { className = "", error, prefixContent, ...props },
  ref,
) {
  const borderClass = error
    ? "border-red-400 focus:border-red-500"
    : "border-[#E5E7EB] focus:border-brand-yellow";

  return (
    <div
      className={`flex h-[46px] items-center rounded-[14px] border bg-white px-4 transition-colors ${borderClass} ${className}`.trim()}
    >
      {prefixContent ? (
        <span className="mr-2 text-sm text-text-muted">{prefixContent}</span>
      ) : null}
      <input
        ref={ref}
        className="w-full border-0 bg-transparent text-sm tracking-[-0.1504px] text-brand-dark outline-none placeholder:text-[rgba(35,31,32,0.5)]"
        {...props}
      />
    </div>
  );
});
