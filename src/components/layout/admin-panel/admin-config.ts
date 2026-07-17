import {
  BadgePercent,
  FileText,
  Image,
  MessageSquare,
  Package,
  Settings,
  Store,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type AdminSectionKey =
  | "sales"
  | "products"
  | "flash-sale"
  | "vendors"
  | "users"
  | "suporte"
  | "coupons"
  | "reports"
  | "assets"
  | "config";

export type AdminNavItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  key: AdminSectionKey;
  label: string;
  shortLabel: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    key: "sales",
    href: "/admin/sales",
    icon: TrendingUp,
    label: "Vendas",
    shortLabel: "Vendas",
    description: "Receita, pedidos e mix",
  },
  {
    key: "products",
    href: "/admin/products",
    icon: Package,
    label: "Produtos",
    shortLabel: "Produtos",
    description: "Catalogo e estoque",
  },
  {
    key: "flash-sale",
    href: "/admin/flash-sale",
    icon: Zap,
    label: "Oferta Relampago",
    shortLabel: "Oferta",
    description: "Campanha e janela ativa",
  },
  {
    key: "vendors",
    href: "/admin/vendors",
    icon: Store,
    label: "Vendors",
    shortLabel: "Vendors",
    description: "Contas e cobertura",
  },
  {
    key: "coupons",
    href: "/admin/coupons",
    icon: BadgePercent,
    label: "Cupons",
    shortLabel: "Cupons",
    description: "Engine de cupons e restricoes",
  },
  {
    key: "reports",
    href: "/admin/reports",
    icon: FileText,
    label: "Relatorios",
    shortLabel: "Relatorios",
    description: "Consultas e exportacao",
  },
  {
    key: "assets",
    href: "/admin/assets",
    icon: Image,
    label: "Assets",
    shortLabel: "Assets",
    description: "Hero banners e biblioteca",
  },
  {
    key: "suporte",
    href: "/admin/suporte",
    icon: MessageSquare,
    label: "Suporte",
    shortLabel: "Suporte",
    description: "Conversas escaladas",
  },
  {
    key: "users",
    href: "/admin/users",
    icon: Users,
    label: "Usuarios",
    shortLabel: "Usuarios",
    description: "Contas, roles e historico",
  },
  {
    key: "config",
    href: "/admin/config",
    icon: Settings,
    label: "Configuracao",
    shortLabel: "Config",
    description: "Senha e preferencias",
  },
];

export function isAdminSection(value: string): value is AdminSectionKey {
  return ADMIN_NAV_ITEMS.some((item) => item.key === value);
}
