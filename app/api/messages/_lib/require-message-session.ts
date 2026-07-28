import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export async function requireMessageAccessToken() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return { error: "Não autenticado.", status: 401 } as const;
  }

  return { accessToken: session.accessToken } as const;
}
