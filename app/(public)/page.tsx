import { BestSellersSection } from "@/components/layout/best-sellers";
import { CategoriesNav } from "@/components/layout/categories-nav";
import { FeaturesBar } from "@/components/layout/features-bar";
import { FlashSaleSection } from "@/components/layout/flash-sale";
import { HeroSection } from "@/components/layout/hero-section";
import { NewArrivalsSection } from "@/components/layout/new-arrivals";
import { PartnerBanner } from "@/components/layout/partner-banner";
import { PromoBanner } from "@/components/layout/promo-banner";
import { PromoCardsSection } from "@/components/layout/promo-cards";
import { PromoMarquee } from "@/components/layout/promo-marquee/promo-marquee";

export default function Home() {
  return (
    <main className="flex flex-col bg-white">
      <div className="h-[calc(100vh-125px)] flex flex-col min-h-0">
        <PromoMarquee />
        <HeroSection />
        <FeaturesBar />
        <CategoriesNav />
      </div>
      <FlashSaleSection />
      <PromoBanner />
      <BestSellersSection />
      <PromoCardsSection />
      <NewArrivalsSection />
      <PartnerBanner />
    </main>
  );
}
