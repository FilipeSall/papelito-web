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

/**
 * Item de menu do sidebar do perfil.
 * Suporta estado ativo e variante de perigo (logout).
 */
export function ProfileSidebarItem({
  href,
  icon,
  label,
  isActive = false,
  variant = "default",
}: ProfileSidebarItemProps) {
  const baseClasses =
    "flex h-[53px] w-full items-center justify-between border-b border-bg-light px-5 py-4";

  const activeClasses = isActive ? "bg-brand-dark text-white" : "";

  const textColor =
    variant === "danger"
      ? "text-red-500"
      : isActive
        ? "text-white"
        : "text-gray-600";

  const iconColor =
    variant === "danger"
      ? "text-red-500"
      : isActive
        ? "text-white"
        : "text-gray-500";

  const chevronColor = isActive ? "text-white" : "text-gray-400";

  if (variant === "danger") {
    return (
      <button
        className={baseClasses}
        onClick={() => {
          void signOutAndClearSession({ callbackUrl: "/" });
        }}
        type="button"
      >
        <div className="flex items-center gap-3">
          <span className={`h-4 w-4 ${iconColor}`}>{icon}</span>
          <span className={`text-sm font-medium tracking-[-0.15px] ${textColor}`}>
            {label}
          </span>
        </div>
      </button>
    );
  }

  return (
    <Link className={`${baseClasses} ${activeClasses}`} href={href}>
      <div className="flex items-center gap-3">
        <span className={`h-4 w-4 ${iconColor}`}>{icon}</span>
        <span className={`text-sm font-medium tracking-[-0.15px] ${textColor}`}>
          {label}
        </span>
      </div>
      <svg
        aria-hidden
        className={`h-3.5 w-3.5 ${chevronColor}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
