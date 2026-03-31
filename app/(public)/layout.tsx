import { PublicHeader } from "@/components/layout/public-header";

export default function PublicAreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="min-h-screen bg-white">
      <PublicHeader />
      {children}
    </section>
  );
}
