import {
  Boxes,
  Clock3,
  LayoutDashboard,
  LifeBuoy,
  MapPinned,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type VendorNavItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
  matches?: readonly string[];
};

export const VENDOR_NAV_ITEMS: VendorNavItem[] = [
  { href: "/vendor/dashboard", icon: LayoutDashboard, label: "Dashboard", description: "Visao geral" },
  { href: "/vendor/cobertura", icon: MapPinned, label: "Cobertura", description: "CEPs atendidos" },
  { href: "/vendor/estoque", icon: Boxes, label: "Estoque", description: "Produtos e saldo" },
  { href: "/vendor/pedidos", icon: ShoppingBag, label: "Pedidos", description: "Separacao e envio" },
  { href: "/vendor/chamados", icon: MessageSquare, label: "Chamados", description: "Atendimento" },
  { href: "/vendor/cubagem", icon: Package, label: "Cubagem", description: "Caixas e medidas" },
  { href: "/vendor/solicitacoes", icon: LifeBuoy, label: "Solicitações", description: "Direto com a Papelito" },
  {
    href: "/vendor/configuracoes",
    icon: Settings,
    label: "Configuracoes",
    description: "Operacao",
    matches: ["/vendor/onboarding"],
  },
];

export function isVendorNavItemActive(item: VendorNavItem, pathname: string) {
  return [item.href, ...(item.matches ?? [])].some((prefix) => pathname.startsWith(prefix));
}

export function getVendorPageTitle(pathname: string) {
  return VENDOR_NAV_ITEMS.find((item) => isVendorNavItemActive(item, pathname))?.label ?? "Dashboard";
}

export { Clock3 };
