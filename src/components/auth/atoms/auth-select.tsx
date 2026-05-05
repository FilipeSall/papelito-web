import type { SelectHTMLAttributes } from "react";

interface AuthSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export function AuthSelect({ className, children, ...props }: AuthSelectProps) {
  return (
    <select
      {...props}
      className={`h-12 w-full appearance-none rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white transition focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow ${className ?? ""}`}
    >
      {children}
    </select>
  );
}
