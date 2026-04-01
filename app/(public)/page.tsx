import { CategoriesNav } from "@/components/layout/categories-nav";
import { FeaturesBar } from "@/components/layout/features-bar";
import { FlashSaleSection } from "@/components/layout/flash-sale";
import { HeroSection } from "@/components/layout/hero-section";
import { PromoBanner } from "@/components/layout/promo-banner";

export default function Home() {
  return (
    <main className="flex flex-col bg-white">
      <div className="h-[calc(100vh-125px)] flex flex-col min-h-0">
        <HeroSection />
        <FeaturesBar />
        <CategoriesNav />
      </div>
      <FlashSaleSection />
      <PromoBanner />
    </main>
  );
}
