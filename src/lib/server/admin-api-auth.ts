import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { normalizeAdminRole } from "./admin-vendor-filters";

export type AdminApiSession =
  | { accessToken: string }
  | { error: string; status: 401 | 403 };

export async function getAdminApiSession(): Promise<AdminApiSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return { error: "Nao autenticado.", status: 401 };
  }

  if (normalizeAdminRole(session.role) !== "administrator") {
    return { error: "Acesso negado.", status: 403 };
  }

  return { accessToken: session.accessToken };
}
