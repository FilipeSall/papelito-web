"use client";

import { usePathname } from "next/navigation";

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
  { href: "/perfil", label: "Meus Pedidos", icon: OrdersIcon },
  { href: "/perfil/dados", label: "Meus Dados", icon: UserDataIcon },
  { href: "/perfil/enderecos", label: "Endereços", icon: AddressIcon },
  { href: "/perfil/favoritos", label: "Favoritos", icon: FavoritesIcon },
  { href: "/perfil/configuracoes", label: "Configurações", icon: SettingsIcon },
];

/**
 * Sidebar de navegação do perfil do usuário.
 * Exibe menu com itens de navegação e botão de logout.
 */
export function ProfileSidebar() {
  const pathname = usePathname();
  const { customer } = useProfileShell();
  const isSeller = customer.role.trim().toLowerCase() === "seller";

  return (
    <aside className="w-full overflow-hidden rounded-2xl bg-white shadow-sm lg:w-72 lg:shrink-0 xl:w-80">
      <nav className="flex flex-col">
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
    </aside>
  );
}
