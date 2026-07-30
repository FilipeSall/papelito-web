import { getServerSession } from "next-auth";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-panel";
import { PrivateHeader } from "@/components/layout/private-header";
import { getSiteLogos } from "@/features/catalog/services/get-home-assets";
import { authOptions } from "@/lib/auth";
import { fetchCurrentUserRole } from "@/lib/server/current-user-role";

const adminDisplay = Chakra_Petch({
  subsets: ["latin"],
  variable: "--font-admin-display",
  weight: ["500", "600", "700"],
});

const adminBody = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-admin-body",
  weight: ["400", "500", "600", "700"],
});

const adminMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-admin-mono",
  weight: ["500", "600"],
});

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/entrar");
  }

  if (!session.accessToken || (await fetchCurrentUserRole(session.accessToken)) !== "administrator") {
    redirect("/perfil");
  }

  const logos = await getSiteLogos();

  return (
    <section
      className={`${adminDisplay.variable} ${adminBody.variable} ${adminMono.variable} flex h-screen flex-col overflow-hidden bg-bg-light`}
    >
      <PrivateHeader logo={logos.privateHeader} />
      <main className="min-h-0 flex-1 overflow-hidden">
        <AdminShell>{children}</AdminShell>
      </main>
    </section>
  );
}
