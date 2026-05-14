import { use } from "react";
import { BestSellersSection } from "@/components/layout/best-sellers";
import { CategoriesNav } from "@/components/layout/categories-nav";
import { FeaturesBar } from "@/components/layout/features-bar";
import { FlashSaleSection } from "@/components/layout/flash-sale";
import { HeroSection } from "@/components/layout/hero-section";
import { NewArrivalsSection } from "@/components/layout/new-arrivals";
import { AddToCartToastHost } from "@/components/layout/products-page/add-to-cart-toast-host";
import { PartnerBanner } from "@/components/layout/partner-banner";
import { PromoBanner } from "@/components/layout/promo-banner";
import { PromoCardsSection } from "@/components/layout/promo-cards";
import { PromoMarquee } from "@/components/layout/promo-marquee/promo-marquee";
import { useHomeProducts } from "@/features/catalog";

export default function Home() {
  // TODO: Quando a integração real estiver pronta, manter este consumo server-side
  // apontando para a API de catálogo/home em vez do mock local.
  const { flashSaleCampaign, bestSellerProducts, newArrivalProducts } = use(
    useHomeProducts(),
  );

  return (
    <main className="flex flex-col bg-white">
      <AddToCartToastHost />
      <div className="flex flex-col">
        <PromoMarquee />
        <HeroSection />
        <FeaturesBar />
        <CategoriesNav />
      </div>
      {flashSaleCampaign ? <FlashSaleSection campaign={flashSaleCampaign} /> : null}
      {flashSaleCampaign ? <PromoBanner /> : null}
      <BestSellersSection products={bestSellerProducts} />
      <PromoCardsSection />
      <NewArrivalsSection products={newArrivalProducts} />
      <PartnerBanner />
    </main>
  );
}
