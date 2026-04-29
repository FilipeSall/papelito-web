type RevendedorSelectInputProps = React.ComponentPropsWithoutRef<"select"> & {
  error?: string;
};

/**
 * Select base da landing com o mesmo volume visual dos inputs do formulario.
 */
export function RevendedorSelectInput({
  children,
  className = "",
  error,
  ...props
}: RevendedorSelectInputProps) {
  const borderClass = error
    ? "border-red-400 focus:border-red-500"
    : "border-[#E5E7EB] focus:border-brand-yellow";

  return (
    <div
      className={`relative flex h-[46px] items-center rounded-[14px] border bg-white px-4 transition-colors ${borderClass} ${className}`.trim()}
    >
      <select
        className="w-full appearance-none border-0 bg-transparent pr-6 text-sm tracking-[-0.1504px] text-brand-dark outline-none"
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted"
      >
        ▼
      </span>
    </div>
  );
}
