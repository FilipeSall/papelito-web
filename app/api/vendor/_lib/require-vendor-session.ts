import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isCurrentUserSeller } from "@/lib/server/current-user-role";

export async function requireVendorAccessToken() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return { error: "Nao autenticado.", status: 401 as const };
  }

  if (!(await isCurrentUserSeller(session.accessToken))) {
    return { error: "Acesso restrito a vendors.", status: 403 as const };
  }

  return { accessToken: session.accessToken };
}
