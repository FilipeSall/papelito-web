import type { InputHTMLAttributes } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function AuthInput({ className, ...props }: AuthInputProps) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/30 transition focus:border-brand-yellow focus:outline-none focus:ring-1 focus:ring-brand-yellow ${className ?? ""}`}
    />
  );
}
