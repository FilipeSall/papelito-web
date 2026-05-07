export type AdminSectionKey =
  | "overview"
  | "sales"
  | "products"
  | "flash-sale"
  | "vendors"
  | "reports"
  | "assets";

export type AdminNavItem = {
  description: string;
  href: string;
  key: AdminSectionKey;
  label: string;
  shortLabel: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    key: "overview",
    href: "/admin",
    label: "Visao Geral",
    shortLabel: "Geral",
    description: "Pulse operacional",
  },
  {
    key: "sales",
    href: "/admin/sales",
    label: "Vendas",
    shortLabel: "Vendas",
    description: "Receita, pedidos e mix",
  },
  {
    key: "products",
    href: "/admin/products",
    label: "Produtos",
    shortLabel: "Produtos",
    description: "Catalogo e estoque",
  },
  {
    key: "flash-sale",
    href: "/admin/flash-sale",
    label: "Oferta Relampago",
    shortLabel: "Oferta",
    description: "Campanha e janela ativa",
  },
  {
    key: "vendors",
    href: "/admin/vendors",
    label: "Vendors",
    shortLabel: "Vendors",
    description: "Triagem e cobertura",
  },
  {
    key: "reports",
    href: "/admin/reports",
    label: "Relatorios",
    shortLabel: "Relatorios",
    description: "Consultas e exportacao",
  },
  {
    key: "assets",
    href: "/admin/assets",
    label: "Assets",
    shortLabel: "Assets",
    description: "Hero banners e biblioteca",
  },
];

export function isAdminSection(value: string): value is Exclude<AdminSectionKey, "overview"> {
  return ADMIN_NAV_ITEMS.slice(1).some((item) => item.key === value);
}
