"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PrivateHeaderCartIcon } from "./cart-icon";
import { privateLinks } from "./constants";
import { PrivateHeaderLogo } from "./logo";
import { PrivateHeaderLogoutButton } from "./logout-button";
import { PrivateHeaderMobileMenu } from "./mobile-menu";
import { PrivateHeaderNav } from "./nav";
import { SellerPurchaseGuard } from "@/components/layout/seller-purchase-guard";
import { NotificationBell } from "@/components/layout/site-header";
import { useCartStore } from "@/features/cart";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { ManagedImageAsset } from "@/types/home-assets";

const iconButtonClass =
  "order-0 flex h-7 w-7 flex-none grow-0 items-center justify-center transition hover:opacity-70";

type PrivateHeaderProps = {
  logo?: ManagedImageAsset;
};

/**
 * Cabeçalho das páginas privadas da Papelito.
 * Compõe as variantes mobile e desktop a partir dos sub-componentes atômicos do módulo.
 * Utiliza fundo escuro (#231F20) e elementos claros para contraste.
 */
export function PrivateHeader({ logo }: PrivateHeaderProps) {
  const cartItemCount = useCartStore((state) =>
    state.items.reduce((count, item) => count + item.quantity, 0),
  );
  const { isAdministrator, isSeller } = useAuthSession();
  const pathname = usePathname();

  const isAdminRoute = pathname?.startsWith("/admin");

  const contextLink =
    isAdministrator && !isAdminRoute
      ? { href: "/admin/sales", label: "Admin" }
      : isSeller
        ? { href: "/vendor/dashboard", label: "Painel vendor" }
        : null;
  const mobileLinks = contextLink
    ? [contextLink, ...privateLinks.map(({ href, label }) => ({ href, label }))]
    : privateLinks.map(({ href, label }) => ({ href, label }));

  return (
    <header className="w-full border-b border-white/10 bg-brand-dark">
      <SellerPurchaseGuard />
      {/* Mobile */}
      <div className="mx-auto flex w-full max-w-391 items-center justify-between px-4 py-3.75 md:hidden">
        <PrivateHeaderLogo logo={logo} />

        <div className="flex items-start gap-2 pt-1">
          <NotificationBell inverted />
          <PrivateHeaderCartIcon buttonClass={iconButtonClass} count={cartItemCount} />

          <PrivateHeaderMobileMenu
            iconButtonClass={`${iconButtonClass} text-white`}
            links={mobileLinks}
          />
        </div>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-391 grid-cols-[1fr_auto_1fr] items-center gap-6 md:grid md:h-23.25 md:px-8">
        <PrivateHeaderLogo logo={logo} />

        <PrivateHeaderNav links={privateLinks} />

        <div className="order-2 flex h-9 flex-none grow-0 items-center justify-self-end gap-4">
          <NotificationBell inverted />
          <PrivateHeaderCartIcon buttonClass={iconButtonClass} count={cartItemCount} />
          {isAdministrator && !isAdminRoute ? (
            <Link
              className="inline-flex h-9 items-center rounded-full border border-white/18 px-4 text-sm font-black leading-5 tracking-[-0.15px] text-white transition hover:border-white/28 hover:bg-white/6"
              href="/admin/sales"
            >
              Admin
            </Link>
          ) : isSeller ? (
            <Link
              className="inline-flex h-9 items-center rounded-full border border-white/18 px-4 text-sm font-black leading-5 tracking-[-0.15px] text-white transition hover:border-white/28 hover:bg-white/6"
              href="/vendor/dashboard"
            >
              Painel vendor
            </Link>
          ) : null}
          <PrivateHeaderLogoutButton />
        </div>
      </div>
    </header>
  );
}
