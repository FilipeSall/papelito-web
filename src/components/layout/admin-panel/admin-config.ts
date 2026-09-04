import {
  BadgePercent,
  FolderTree,
  Image,
  MessageSquare,
  Package,
  Settings,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type AdminSectionKey =
  | "sales"
  | "products"
  | "categories"
  | "flash-sale"
  | "contas"
  | "suporte"
  | "comercial"
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
    description: "Catálogo e estoque",
  },
  {
    key: "categories",
    href: "/admin/categories",
    icon: FolderTree,
    label: "Categorias",
    shortLabel: "Categorias",
    description: "Taxonomia e subcategorias",
  },
  {
    key: "flash-sale",
    href: "/admin/flash-sale",
    icon: Zap,
    label: "Oferta Relâmpago",
    shortLabel: "Oferta",
    description: "Campanha e janela ativa",
  },
  {
    key: "contas",
    href: "/admin/contas",
    icon: Users,
    label: "Contas",
    shortLabel: "Contas",
    description: "Pessoas, empresas e análises",
  },
  {
    key: "comercial",
    href: "/admin/comercial",
    icon: BadgePercent,
    label: "Comercial",
    shortLabel: "Comercial",
    description: "Cupons, frete grátis e coleções",
  },
  {
    key: "assets",
    href: "/admin/assets",
    icon: Image,
    label: "Assets",
    shortLabel: "Assets",
    description: "Banners e biblioteca de imagens",
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
    key: "config",
    href: "/admin/config",
    icon: Settings,
    label: "Configuração",
    shortLabel: "Config",
    description: "Senha e preferências",
  },
];

export function isAdminSection(value: string): value is AdminSectionKey {
  return ADMIN_NAV_ITEMS.some((item) => item.key === value);
}
