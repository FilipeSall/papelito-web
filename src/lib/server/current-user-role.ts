import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

type AuthIdentityResponse = {
  user?: {
    role?: string | null;
  } | null;
};

export function normalizeCurrentUserRole(role: unknown): string | undefined {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export async function fetchCurrentUserRole(accessToken: string): Promise<string | undefined> {
  const identity = await wpRest<AuthIdentityResponse>("/papelito/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!identity.ok) {
    return undefined;
  }

  return normalizeCurrentUserRole(identity.data.user?.role);
}

export async function isCurrentUserSeller(
  accessToken: string,
  sessionRole?: unknown,
): Promise<boolean> {
  if (normalizeCurrentUserRole(sessionRole) === "seller") {
    return true;
  }

  return (await fetchCurrentUserRole(accessToken)) === "seller";
}
