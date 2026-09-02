import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getSiteLogos } from "@/features/catalog/services/get-home-assets";

export default async function PublicAreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const logos = await getSiteLogos();

  return (
    <section className="flex flex-col overflow-x-clip bg-white pt-15 md:pt-23.25">
      <PublicHeader logo={logos.publicHeader} />
      {children}
      <PublicFooter logo={logos.footer} />
    </section>
  );
}
