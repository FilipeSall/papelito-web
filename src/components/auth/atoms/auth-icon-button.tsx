import type { ButtonHTMLAttributes, ReactNode } from "react";

interface AuthIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function AuthIconButton({ children, ...props }: AuthIconButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className="absolute top-1/2 right-4 -translate-y-1/2 text-white/50 transition hover:text-white"
    >
      {children}
    </button>
  );
}
