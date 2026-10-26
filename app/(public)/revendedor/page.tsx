import { RevendedorPage } from "@/components/layout/revendedor-page";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Seja revendedor — fornecedor B2B para todo o Brasil",
  description:
    "Cadastre sua empresa e compre sedas, piteiras, filtros e acessórios Papelito para revenda. Para distribuidores, atacadistas, tabacarias, headshops, lojas de conveniência e comércio em geral.",
  path: "/revendedor",
});

/**
 * Landing de quem compra Papelito para revender. Pública e cacheável: quem já está logado nem
 * chega aqui, o `proxy.ts` manda para `/cadastro/completar`.
 */
export default async function RevendedorRoutePage() {
  const images = await getSiteImageAssets();

  return <RevendedorPage images={images} />;
}
