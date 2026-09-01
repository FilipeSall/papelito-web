"use client";

import Link from "next/link";
import { ReactNode } from "react";

import { signOutAndClearSession } from "@/features/auth/client/logout";

type ProfileSidebarItemProps = {
  href: string;
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  variant?: "default" | "danger";
};

const baseClass =
  "group flex min-h-13 w-full cursor-pointer items-center justify-between gap-3 border-b-2 border-[#1a1a1a]/12 px-5 py-3.5 text-left transition-colors last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-yellow";

/**
 * Item de navegação do painel do comprador.
 * Ativo vira bloco preto com marcador amarelo; a saída da conta usa o vermelho de erro da marca.
 */
export function ProfileSidebarItem({
  href,
  icon,
  label,
  isActive = false,
  variant = "default",
}: ProfileSidebarItemProps) {
  if (variant === "danger") {
    return (
      <button
        className={`${baseClass} bg-transparent text-[#c0392b] hover:bg-[#c0392b] hover:text-white`}
        onClick={() => {
          void signOutAndClearSession({ callbackUrl: "/" });
        }}
        type="button"
      >
        <span className="flex items-center gap-3">
          <span className="h-4 w-4 shrink-0">{icon}</span>
          <span className="text-xs font-black uppercase tracking-[0.16em]">{label}</span>
        </span>
      </button>
    );
  }

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`${baseClass} ${
        isActive
          ? "bg-[#1a1a1a] text-brand-yellow"
          : "bg-transparent text-[#1a1a1a]/72 hover:bg-[#1a1a1a]/6 hover:text-[#1a1a1a]"
      }`}
      href={href}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="h-4 w-4 shrink-0">{icon}</span>
        <span className="truncate text-xs font-black uppercase tracking-[0.16em]">{label}</span>
      </span>
      <span
        aria-hidden
        className={`h-2 w-2 shrink-0 rotate-45 transition-colors ${
          isActive ? "bg-brand-yellow" : "bg-[#1a1a1a]/20 group-hover:bg-[#1a1a1a]/45"
        }`}
      />
    </Link>
  );
}
