import { ProductsGrid, ProductsHeroBanner } from "@/components/layout/products-page";
import { getKitsCatalog } from "@/features/catalog/services/get-kits-catalog";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";

export const revalidate = 60;

export default async function KitsPage() {
  const [kits, siteImages] = await Promise.all([getKitsCatalog(), getSiteImageAssets()]);
  return <main className="flex flex-col bg-white">
    <ProductsHeroBanner image={siteImages.productHero} />
    <section className="mx-auto w-full max-w-7xl px-6 py-10 md:px-12"><div className="mb-7 border-l-4 border-brand-yellow pl-4"><p className="text-[11px] font-black uppercase tracking-[.18em] text-[#5e574c]">Composição Papelito</p><h1 className="mt-1 text-3xl font-black uppercase text-[#231f20]">Kits</h1><p className="mt-2 text-sm text-[#5e574c]">Produtos selecionados para comprar juntos, com preço próprio.</p></div><ProductsGrid activeCollection="kits" emptyMessage="Nenhum Kit disponível no momento." products={kits} variant="collection" viewMode="grid" /></section>
  </main>;
}
