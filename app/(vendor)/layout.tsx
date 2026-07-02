import { getServerSession } from "next-auth";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { redirect } from "next/navigation";

import { VendorShell } from "@/components/layout/vendor-panel";
import { authOptions } from "@/lib/auth";
import { isCurrentUserSeller } from "@/lib/server/current-user-role";

const vendorDisplay = Chakra_Petch({
  subsets: ["latin"],
  variable: "--font-admin-display",
  weight: ["500", "600", "700"],
});
const vendorBody = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-admin-body",
  weight: ["400", "500", "600", "700"],
});
const vendorMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-admin-mono",
  weight: ["500", "600"],
});

export default async function VendorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/entrar");
  }

  if (!session.accessToken || !(await isCurrentUserSeller(session.accessToken))) {
    redirect("/");
  }

  return (
    <section className={`${vendorDisplay.variable} ${vendorBody.variable} ${vendorMono.variable} h-screen overflow-hidden font-(--font-admin-body)`}>
      <VendorShell>{children}</VendorShell>
    </section>
  );
}
