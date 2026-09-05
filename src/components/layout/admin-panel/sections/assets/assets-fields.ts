import type { SiteImageAssetKey, SiteLogoKey } from "@/types/home-assets";

import type { AssetsPageKey } from "./assets-config";

export type SiteImageFieldConfig = {
  description: string;
  formatHint: string;
  key: SiteImageAssetKey;
  page: AssetsPageKey;
  previewClass?: string;
  title: string;
  where: string;
};

export const SITE_IMAGE_FIELDS: SiteImageFieldConfig[] = [
  {
    description: "Banner do topo da página /produtos, atrás do título Nossos Produtos.",
    formatHint: "Formato ideal: horizontal largo, aproximadamente 3.5:1.",
    key: "productHero",
    page: "produtos",
    title: "Imagem de produtos",
    where: "Topo de /produtos, atrás do título",
  },
  {
    description: "Imagem larga no topo da página /sobre.",
    formatHint: "Formato ideal: horizontal, aproximadamente 16:10.",
    key: "aboutHero",
    page: "sobre",
    title: "Banner da página Sobre",
    where: "Topo de /sobre",
  },
  {
    description:
      'Foto ao lado do bloco "Mais de uma década de história" na página /sobre.',
    formatHint: "Formato ideal: foto horizontal 3:2 com assunto central.",
    key: "aboutStory",
    page: "sobre",
    title: "Imagem da história",
    where: "Bloco Mais de uma década de história",
  },
  {
    description:
      'Foto grande ao lado do título "Atendemos Diferentes Tipos de Negócios!" em /revendedor.',
    formatHint: "Formato ideal: foto vertical 2:3 com foco no centro.",
    key: "revendedorBusinessMain",
    page: "revendedor",
    title: "Imagem principal dos negócios",
    where: "Mosaico de negócios, foto principal",
  },
  {
    description: "Foto menor do mosaico de negócios atendidos em /revendedor.",
    formatHint: "Formato ideal: foto horizontal ou vertical com crop seguro no centro.",
    key: "revendedorBusinessSecondary",
    page: "revendedor",
    title: "Imagem secundária dos negócios",
    where: "Mosaico de negócios, foto menor",
  },
];

export function siteImageFieldsFor(page: AssetsPageKey): SiteImageFieldConfig[] {
  return SITE_IMAGE_FIELDS.filter((field) => field.page === page);
}

export type SiteLogoFieldConfig = {
  description: string;
  formatHint: string;
  key: SiteLogoKey;
  title: string;
  where: string;
};

export const SITE_LOGO_FIELDS: SiteLogoFieldConfig[] = [
  {
    description:
      "Cabeçalho da home, produtos, sobre e demais páginas abertas, no mobile e no desktop.",
    formatHint: "Formato ideal: horizontal com fundo transparente, SVG ou PNG.",
    key: "publicHeader",
    title: "Logo das rotas públicas",
    where: "Cabeçalho das rotas públicas",
  },
  {
    description:
      "Cabeçalho das áreas autenticadas: perfil, painel administrativo e painel do vendor.",
    formatHint: "Formato ideal: horizontal com fundo transparente, SVG ou PNG.",
    key: "privateHeader",
    title: "Logo das rotas privadas",
    where: "Cabeçalho das áreas autenticadas",
  },
  {
    description: "Rodapé exibido nas rotas públicas e nas rotas autenticadas.",
    formatHint: "Formato ideal: assinatura horizontal clara, aproximadamente 6:1.",
    key: "footer",
    title: "Logo do rodapé",
    where: "Rodapé, público e autenticado",
  },
];

export const LOGO_ACCEPT = "image/svg+xml,image/png,image/webp";
