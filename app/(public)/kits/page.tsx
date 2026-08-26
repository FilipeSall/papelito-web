import { ProductsGrid, ProductsHeroBanner } from "@/components/layout/products-page";
import { getKitsCatalog } from "@/features/catalog/services/get-kits-catalog";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";
import { ProductAvailabilityProvider } from "@/features/catalog/hooks/use-product-availability";
import { JsonLd, buildItemListJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Kits para revenda no atacado",
  description:
    "Kits montados pela Papelito com sedas, piteiras, filtros e acessórios, com preço fechado para lojistas e revendedores. Compra B2B com CNPJ e entrega por revendedor regional.",
  path: "/kits",
});

export const revalidate = 60;

export default async function KitsPage() {
  const [kits, siteImages] = await Promise.all([getKitsCatalog(), getSiteImageAssets()]);
  return <main className="flex flex-col bg-white">
    <JsonLd
      data={buildItemListJsonLd(
        "Kits Papelito",
        kits.map((kit) => ({ name: kit.name, path: kit.href ?? `/produtos/${kit.id}` })),
      )}
    />
    <ProductsHeroBanner image={siteImages.productHero} />
    <section className="mx-auto w-full max-w-7xl px-6 py-10 md:px-12"><div className="mb-7 border-l-4 border-brand-yellow pl-4"><p className="text-[11px] font-black uppercase tracking-[.18em] text-[#5e574c]">Composição Papelito</p><h1 className="mt-1 text-3xl font-black uppercase text-[#231f20]">Kits</h1><p className="mt-2 text-sm text-[#5e574c]">Produtos selecionados para comprar juntos, com preço próprio.</p></div><ProductAvailabilityProvider productIds={kits.map((kit) => kit.id)}><ProductsGrid activeCollection="kits" emptyMessage="Nenhum Kit disponível no momento." products={kits} variant="collection" viewMode="grid" /></ProductAvailabilityProvider></section>
  </main>;
}
