import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export async function requireVendorAccessToken() {
  const session = await getServerSession(authOptions);
  const role = typeof session?.role === "string" ? session.role.trim().toLowerCase() : "";

  if (!session?.accessToken) {
    return { error: "Nao autenticado.", status: 401 as const };
  }

  if (role !== "seller") {
    return { error: "Acesso restrito a vendors.", status: 403 as const };
  }

  return { accessToken: session.accessToken };
}
