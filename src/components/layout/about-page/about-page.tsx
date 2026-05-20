import { AboutHero } from "./about-hero";
import { AboutStorySection } from "./about-story-section";
import { AboutValuesSection } from "./about-values-section";
import type { SiteImageAssets } from "@/types/home-assets";

export function AboutPage({ images }: { images?: SiteImageAssets }) {
  return (
    <main className="flex flex-col bg-white pb-16 lg:pb-[81px]">
      <AboutHero image={images?.aboutHero} />
      <AboutStorySection image={images?.aboutStory} />
      <AboutValuesSection />
    </main>
  );
}
