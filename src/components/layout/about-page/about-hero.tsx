import { AboutBannerImage } from "./atoms/about-banner-image";
import type { ManagedImageAsset } from "@/types/home-assets";

export function AboutHero({ image }: { image?: ManagedImageAsset }) {
  return (
    <section className="hidden md:block">
      <div className="relative aspect-[1084/301] w-full overflow-hidden">
        <AboutBannerImage image={image} />
      </div>
    </section>
  );
}
