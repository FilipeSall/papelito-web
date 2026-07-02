import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isCurrentUserSeller } from "@/lib/server/current-user-role";

export async function getSellerAccessToken() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return null;
  }

  return (await isCurrentUserSeller(session.accessToken)) ? session.accessToken : null;
}
