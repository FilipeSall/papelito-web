import type { ReactNode } from "react";

interface AuthSubmitButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export function AuthSubmitButton({
  children,
  icon,
  disabled = false,
}: Readonly<AuthSubmitButtonProps>) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-yellow px-5 font-black uppercase leading-none tracking-wide text-brand-dark transition hover:bg-brand-yellow/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="whitespace-nowrap leading-none">{children}</span>
      {icon ? (
        <span className="flex shrink-0 items-center leading-none">{icon}</span>
      ) : null}
    </button>
  );
}
