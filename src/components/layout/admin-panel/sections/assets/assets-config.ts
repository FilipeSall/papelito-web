import { BookOpen, Globe, Handshake, House, Package, type LucideIcon } from "lucide-react";

export const ASSETS_PATH = "/admin/assets";

export const ASSETS_PAGE_KEYS = ["global", "home", "produtos", "sobre", "revendedor"] as const;

export type AssetsPageKey = (typeof ASSETS_PAGE_KEYS)[number];

export const DEFAULT_ASSETS_PAGE: AssetsPageKey = "home";

export type AssetsPageDefinition = {
  description: string;
  icon: LucideIcon;
  key: AssetsPageKey;
  label: string;
  publicHref: string;
  publicLabel: string;
};

/**
 * O registro de páginas é o eixo da tela: cada entrada vira um segmento, um painel de conteúdo e
 * um link para a página pública correspondente. Uma página nova do site entra aqui e em nenhum
 * outro lugar da navegação.
 */
export const ASSETS_PAGES: AssetsPageDefinition[] = [
  {
    description:
      "As logos usadas em todo o site: cabeçalho das rotas públicas, cabeçalho das áreas autenticadas e rodapé.",
    icon: Globe,
    key: "global",
    label: "Global",
    publicHref: "/",
    publicLabel: "Ver site",
  },
  {
    description:
      "O que o cliente vê primeiro: a Hero Section, a faixa de avisos, os benefícios comerciais e o bloco PDV Perfeito.",
    icon: House,
    key: "home",
    label: "Home",
    publicHref: "/",
    publicLabel: "Ver /",
  },
  {
    description: "A imagem larga atrás do título da vitrine de produtos.",
    icon: Package,
    key: "produtos",
    label: "Produtos",
    publicHref: "/produtos",
    publicLabel: "Ver /produtos",
  },
  {
    description: "O banner do topo e a foto que acompanha o bloco de história.",
    icon: BookOpen,
    key: "sobre",
    label: "Sobre",
    publicHref: "/sobre",
    publicLabel: "Ver /sobre",
  },
  {
    description:
      "O mosaico de negócios atendidos e o PDF do catálogo comercial aberto pelo botão da página.",
    icon: Handshake,
    key: "revendedor",
    label: "Revendedor",
    publicHref: "/revendedor",
    publicLabel: "Ver /revendedor",
  },
];

export function parseAssetsPage(value: string | undefined): AssetsPageKey {
  return (ASSETS_PAGE_KEYS as readonly string[]).includes(value ?? "")
    ? (value as AssetsPageKey)
    : DEFAULT_ASSETS_PAGE;
}

export function assetsPageDefinition(page: AssetsPageKey): AssetsPageDefinition {
  return (
    ASSETS_PAGES.find((entry) => entry.key === page) ??
    ASSETS_PAGES.find((entry) => entry.key === DEFAULT_ASSETS_PAGE)!
  );
}

export function assetsHref(page: AssetsPageKey): string {
  return page === DEFAULT_ASSETS_PAGE ? ASSETS_PATH : `${ASSETS_PATH}?pagina=${page}`;
}
