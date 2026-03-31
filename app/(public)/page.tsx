import { FeaturesBar } from "@/components/layout/features-bar";
import { HeroSection } from "@/components/layout/hero-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesBar />
    </main>
  );
}
