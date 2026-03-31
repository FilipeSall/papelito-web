import { CategoriesNav } from "@/components/layout/categories-nav";
import { FeaturesBar } from "@/components/layout/features-bar";
import { HeroSection } from "@/components/layout/hero-section";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col bg-white">
      <HeroSection />
      <FeaturesBar />
      <CategoriesNav />
    </main>
  );
}
