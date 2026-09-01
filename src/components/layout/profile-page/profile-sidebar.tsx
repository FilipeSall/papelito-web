"use client";

import { usePathname } from "next/navigation";

import { ProfilePanel } from "./profile-panel";
import {
  AddressIcon,
  FavoritesIcon,
  LogoutIcon,
  OrdersIcon,
  SettingsIcon,
  UserDataIcon,
} from "./profile-sidebar-icons";
import { ProfileSidebarItem } from "./profile-sidebar-item";
import { useProfileShell } from "./profile-shell-provider";

const menuItems = [
  { href: "/perfil", label: "Meus pedidos", icon: OrdersIcon },
  { href: "/perfil/dados", label: "Meus dados", icon: UserDataIcon },
  { href: "/perfil/empresa", label: "Minha empresa", icon: UserDataIcon },
  { href: "/perfil/enderecos", label: "Endereços", icon: AddressIcon },
  { href: "/perfil/favoritos", label: "Favoritos", icon: FavoritesIcon },
  { href: "/perfil/configuracoes", label: "Configurações", icon: SettingsIcon },
];

/**
 * Navegação lateral do painel do comprador, no mesmo recorte dos painéis de vendor e admin.
 */
export function ProfileSidebar() {
  const pathname = usePathname();
  const { customer } = useProfileShell();
  const isSeller = customer.role.trim().toLowerCase() === "seller";

  return (
    <ProfilePanel
      accent
      className="w-full self-start lg:sticky lg:top-6 lg:w-72 lg:shrink-0 xl:w-80"
    >
      <nav aria-label="Seções da minha conta" className="flex flex-col">
        {isSeller ? (
          <ProfileSidebarItem
            href="/vendor/dashboard"
            icon={<OrdersIcon className="h-4 w-4" />}
            isActive={pathname.startsWith("/vendor")}
            key="/vendor/dashboard"
            label="Painel vendor"
          />
        ) : null}
        {menuItems.map((item) => (
          <ProfileSidebarItem
            href={item.href}
            icon={<item.icon className="h-4 w-4" />}
            isActive={pathname === item.href}
            key={item.href}
            label={item.label}
          />
        ))}
        <ProfileSidebarItem
          href="/sair"
          icon={<LogoutIcon className="h-4 w-4" />}
          label="Sair da conta"
          variant="danger"
        />
      </nav>
    </ProfilePanel>
  );
}
