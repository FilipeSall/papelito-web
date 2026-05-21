import { PublicFooter } from "@/components/layout/public-footer";
import { PrivateHeader } from "@/components/layout/private-header";
import { AccountCepNotice } from "@/components/layout/profile-page";
import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";

export default async function AppAreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const coverageContext = await getAccountCoverageCepContext();

  return (
    <section className="flex min-h-screen flex-col bg-bg-light">
      <PrivateHeader />
      <AccountCepNotice show={coverageContext.isAuthenticated && !coverageContext.cep} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </section>
  );
}
