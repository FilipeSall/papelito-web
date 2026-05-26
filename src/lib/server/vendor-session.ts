import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export async function getSellerAccessToken() {
  const session = await getServerSession(authOptions);
  const role = typeof session?.role === "string" ? session.role.trim().toLowerCase() : "";

  if (role !== "seller" || !session?.accessToken) {
    return null;
  }

  return session.accessToken;
}
