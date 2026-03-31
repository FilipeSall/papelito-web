import { PublicHeader } from "@/components/layout/public-header";
import { PromoMarquee } from "@/components/layout/promo-marquee";

export default function PublicAreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="min-h-screen bg-white">
      <PublicHeader />
      <PromoMarquee />
      {children}
    </section>
  );
}
