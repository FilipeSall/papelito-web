import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function PublicAreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="flex flex-col bg-white">
      <PublicHeader />
      {children}
      <PublicFooter />
    </section>
  );
}
