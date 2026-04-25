import { AboutBannerImage } from "./atoms/about-banner-image";

export function AboutHero() {
  return (
    <section className="hidden md:block">
      <div className="relative aspect-[1084/301] w-full overflow-hidden">
        <AboutBannerImage />
      </div>
    </section>
  );
}
