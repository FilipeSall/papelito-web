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
import {
  getHomeHeroBanners,
  getHomePartnerBanner,
  getHomePromoBanner,
} from "@/features/catalog/services/get-home-assets";
import { useHomeProducts } from "@/features/catalog";

export default function Home() {
  const [
    { flashSaleCampaign, bestSellerProducts, newArrivalProducts },
    heroBanners,
    promoBanner,
    partnerBanner,
  ] = use(
    Promise.all([
      useHomeProducts(),
      getHomeHeroBanners(),
      getHomePromoBanner(),
      getHomePartnerBanner(),
    ]),
  );

  return (
    <main className="flex flex-col bg-white">
      <AddToCartToastHost />
      <div className="flex flex-col">
        <PromoMarquee />
        <HeroSection banners={heroBanners} />
        <FeaturesBar />
        <CategoriesNav />
      </div>
      {flashSaleCampaign ? <FlashSaleSection campaign={flashSaleCampaign} /> : null}
      {flashSaleCampaign && promoBanner ? <PromoBanner banner={promoBanner} /> : null}
      <BestSellersSection products={bestSellerProducts} />
      <PromoCardsSection />
      <NewArrivalsSection products={newArrivalProducts} />
      {partnerBanner ? <PartnerBanner banner={partnerBanner} /> : null}
    </main>
  );
}
