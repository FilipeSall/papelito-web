import type { ReactNode } from "react";

import { AuthSpinnerIcon } from "./auth-icons";

interface AuthSubmitButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

export function AuthSubmitButton({
  children,
  icon,
  disabled = false,
  loading = false,
  loadingLabel,
}: Readonly<AuthSubmitButtonProps>) {
  return (
    <button
      type="submit"
      aria-busy={loading}
      disabled={disabled || loading}
      className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-yellow px-5 font-black uppercase leading-none tracking-wide text-brand-dark transition hover:bg-brand-yellow/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="whitespace-nowrap leading-none">
        {loading && loadingLabel ? loadingLabel : children}
      </span>
      {loading ? (
        <span className="flex shrink-0 items-center leading-none">
          <AuthSpinnerIcon className="h-5 w-5 animate-spin" />
        </span>
      ) : icon ? (
        <span className="flex shrink-0 items-center leading-none">{icon}</span>
      ) : null}
    </button>
  );
}
