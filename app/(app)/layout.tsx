import { PublicFooter } from "@/components/layout/public-footer";
import { PrivateHeader } from "@/components/layout/private-header";
import { AccountCepNotice } from "@/components/layout/profile-page";
import { AccountSuspensionNotice } from "@/features/account-status";
import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { getSiteLogos } from "@/features/catalog/services/get-home-assets";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Minha conta");

export default async function AppAreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [coverageContext, logos] = await Promise.all([
    getAccountCoverageCepContext(),
    getSiteLogos(),
  ]);

  return (
    <section className="flex min-h-screen flex-col bg-bg-light">
      <PrivateHeader logo={logos.privateHeader} />
      <AccountSuspensionNotice />
      <AccountCepNotice show={coverageContext.isAuthenticated && !coverageContext.cep} />
      <main className="flex-1">{children}</main>
      <PublicFooter logo={logos.footer} />
    </section>
  );
}
