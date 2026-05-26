import {
  Boxes,
  Clock3,
  LayoutDashboard,
  MessageSquare,
  ReceiptText,
  Settings,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type VendorNavItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
};

export const VENDOR_NAV_ITEMS: VendorNavItem[] = [
  { href: "/vendor/dashboard", icon: LayoutDashboard, label: "Dashboard", description: "Visao geral" },
  { href: "/vendor/estoque", icon: Boxes, label: "Estoque", description: "Produtos e saldo" },
  { href: "/vendor/pedidos", icon: ShoppingBag, label: "Pedidos", description: "Separacao e envio" },
  { href: "/vendor/financeiro", icon: Wallet, label: "Financeiro", description: "Faturamento" },
  { href: "/vendor/historico-compras", icon: ReceiptText, label: "Historico", description: "Reposicao" },
  { href: "/vendor/mensagens", icon: MessageSquare, label: "Mensagens", description: "Atendimento" },
  { href: "/vendor/configuracoes", icon: Settings, label: "Configuracoes", description: "Operacao" },
];

export function getVendorPageTitle(pathname: string) {
  return VENDOR_NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ?? "Dashboard";
}

export { Clock3 };
