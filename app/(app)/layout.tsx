import { PublicFooter } from "@/components/layout/public-footer";
import { PrivateHeader } from "@/components/layout/private-header";

export default function AppAreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="flex min-h-screen flex-col bg-bg-light">
      <PrivateHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </section>
  );
}
