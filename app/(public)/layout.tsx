import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function PublicAreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="flex flex-col overflow-x-clip bg-white pt-16.5 md:pt-23.25">
      <PublicHeader />
      {children}
      <PublicFooter />
    </section>
  );
}
