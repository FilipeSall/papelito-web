import type { ReactNode } from "react";

interface AuthSubmitButtonProps {
  children: ReactNode;
  icon?: ReactNode;
}

export function AuthSubmitButton({ children, icon }: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow font-black uppercase tracking-wide text-brand-dark transition hover:bg-brand-yellow/90"
    >
      {children}
      {icon}
    </button>
  );
}
