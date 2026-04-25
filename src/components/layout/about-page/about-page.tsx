import { AboutHero } from "./about-hero";
import { AboutStorySection } from "./about-story-section";
import { AboutValuesSection } from "./about-values-section";

export function AboutPage() {
  return (
    <main className="flex flex-col bg-white pb-16 lg:pb-[81px]">
      <AboutHero />
      <AboutStorySection />
      <AboutValuesSection />
    </main>
  );
}
