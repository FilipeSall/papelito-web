import "server-only";

import { cache } from "react";

import { wpRest } from "@/lib/server/wp-rest";

type AuthIdentityResponse = {
  user?: {
    role?: string | null;
  } | null;
};

export function normalizeCurrentUserRole(role: unknown): string | undefined {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

/**
 * Papel do usuário autenticado, memoizado **por requisição**.
 *
 * Layout e página do painel chamam esta função no mesmo render, e sem o `cache()` do React isso
 * viraria dois `/auth/me` idênticos no WordPress. Não é cache entre requisições: a autorização
 * continua sendo relida a cada navegação.
 */
export const fetchCurrentUserRole = cache(async function fetchCurrentUserRole(
  accessToken: string,
): Promise<string | undefined> {
  const identity = await wpRest<AuthIdentityResponse>("/papelito/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!identity.ok) {
    return undefined;
  }

  return normalizeCurrentUserRole(identity.data.user?.role);
});

export async function isCurrentUserSeller(accessToken: string): Promise<boolean> {
  return (await fetchCurrentUserRole(accessToken)) === "seller";
}
