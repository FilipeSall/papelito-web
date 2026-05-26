"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MenuUnderline } from "@/components/ui/menu-underline";

type PrivateHeaderNavLinkProps = {
  href: string;
  label: string;
  widthClass?: string;
};

export function PrivateHeaderNavLink({ href, label, widthClass = "" }: PrivateHeaderNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      className={`group relative inline-flex h-5 shrink-0 items-center text-sm font-medium leading-5 tracking-[-0.15px] text-white ${widthClass}`}
      data-active={isActive}
      href={href}
    >
      {label}
      <MenuUnderline />
    </Link>
  );
}
