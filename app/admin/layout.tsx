import { getServerSession } from "next-auth";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-panel";
import { PrivateHeader } from "@/components/layout/private-header";
import { authOptions } from "@/lib/auth";

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

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/entrar");
  }

  const role = normalizeRole(session.role);

  if (role !== "administrator") {
    redirect("/perfil");
  }

  return (
    <section
      className={`${adminDisplay.variable} ${adminBody.variable} ${adminMono.variable} flex min-h-screen flex-col bg-bg-light`}
    >
      <PrivateHeader />
      <main className="flex-1">
        <AdminShell>{children}</AdminShell>
      </main>
    </section>
  );
}
