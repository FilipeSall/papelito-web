"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MenuUnderline } from "@/components/ui/menu-underline";

type PublicHeaderNavLinkProps = {
  href: string;
  label: string;
  widthClass?: string;
};

export function PublicHeaderNavLink({ href, label, widthClass = "" }: PublicHeaderNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      className={`group order-0 relative inline-flex flex-none grow-0 items-center pb-0.5 text-sm font-medium leading-5 tracking-[-0.150391px] text-brand-dark ${widthClass}`}
      data-active={isActive}
      href={href}
    >
      {label}
      <MenuUnderline />
    </Link>
  );
}
