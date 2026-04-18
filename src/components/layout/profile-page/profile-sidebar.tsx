"use client";

import { usePathname } from "next/navigation";

import {
  AddressIcon,
  CouponIcon,
  FavoritesIcon,
  LogoutIcon,
  OrdersIcon,
  PaymentIcon,
  ReviewsIcon,
  SettingsIcon,
  UserDataIcon,
} from "./profile-sidebar-icons";
import { ProfileSidebarItem } from "./profile-sidebar-item";

const menuItems = [
  { href: "/perfil", label: "Meus Pedidos", icon: OrdersIcon },
  { href: "/perfil/dados", label: "Meus Dados", icon: UserDataIcon },
  { href: "/perfil/enderecos", label: "Endereços", icon: AddressIcon },
  { href: "/perfil/pagamentos", label: "Pagamentos", icon: PaymentIcon },
  { href: "/perfil/favoritos", label: "Favoritos", icon: FavoritesIcon },
  { href: "/perfil/avaliacoes", label: "Minhas Avaliações", icon: ReviewsIcon },
  { href: "/perfil/cupons", label: "Meus Cupons", icon: CouponIcon },
  { href: "/perfil/configuracoes", label: "Configurações", icon: SettingsIcon },
];

/**
 * Sidebar de navegação do perfil do usuário.
 * Exibe menu com itens de navegação e botão de logout.
 */
export function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full overflow-hidden rounded-2xl bg-white shadow-sm lg:w-72 lg:shrink-0 xl:w-80">
      <nav className="flex flex-col">
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
