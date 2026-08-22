import "server-only";

import { cache } from "react";
import { getServerSession } from "next-auth";
import { unstable_cache } from "next/cache";

import { authOptions } from "@/lib/auth";
import { getAccountActiveVendorTag } from "@/lib/server/account-cache-tags";
import { wpRest } from "@/lib/server/wp-rest";

import type { ActiveVendor, ActiveVendorError } from "../types/active-vendor";
import { mapActiveVendor, type WpActiveVendor } from "./wp-mappers";

export type ActiveVendorResult =
  | { ok: true; vendor: ActiveVendor }
  | { ok: false; error: ActiveVendorError };

function resolveAccountId(session: {
  user?: {
    id?: string;
    email?: string | null;
  };
} | null) {
  return session?.user?.id ?? session?.user?.email ?? "anonymous";
}

async function fetchActiveVendor(accessToken: string): Promise<ActiveVendorResult> {
  const result = await wpRest<WpActiveVendor>("/papelito/v1/profile/me/active-vendor", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (result.ok) {
    return { ok: true, vendor: mapActiveVendor(result.data) };
  }

  if (result.error.code === "papelito_account_cep_missing") {
    return {
      ok: false,
      error: {
        reason: "missing_cep",
        message: "Cadastre um CEP na sua conta para escolher um vendor.",
      },
    };
  }

  if (result.error.code === "papelito_active_vendor_none_available") {
    return {
      ok: false,
      error: {
        reason: "no_vendor_available",
        message: "Nenhum vendor atende sua região no momento.",
      },
    };
  }

  return {
    ok: false,
    error: {
      reason: result.status === 0 ? "network" : "unknown",
      message: result.error.message,
    },
  };
}

function getCachedActiveVendor(accountId: string, accessToken: string) {
  return unstable_cache(
    async () => {
      const result = await fetchActiveVendor(accessToken);

      if (!result.ok && (result.error.reason === "network" || result.error.reason === "unknown")) {
        throw new Error(result.error.message);
      }

      return result;
    },
    ["account-active-vendor", accountId],
    {
      revalidate: 60,
      tags: [getAccountActiveVendorTag(accountId)],
    },
  )();
}

/**
 * Lê o vendor ativo sem passar pelo cache de 60s.
 *
 * `getActiveVendor()` é cacheado por tag e a invalidação do `revalidateTag` é eventualmente
 * consistente entre route handlers — logo depois de trocar de vendor a leitura cacheada ainda
 * devolve o anterior. Onde o valor decide a qual vendor um item do carrinho (e depois o pedido)
 * fica preso, servir o vendor antigo é o próprio bug que se quer evitar.
 */
export const getActiveVendorFresh = cache(async (): Promise<ActiveVendorResult> => {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return {
      ok: false,
      error: { reason: "unauthenticated", message: "Usuário não autenticado." },
    };
  }

  return fetchActiveVendor(session.accessToken);
});

export const getActiveVendor = cache(async (): Promise<ActiveVendorResult> => {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return {
      ok: false,
      error: { reason: "unauthenticated", message: "Usuário não autenticado." },
    };
  }

  const accountId = resolveAccountId(session);

  try {
    return await getCachedActiveVendor(accountId, session.accessToken);
  } catch {
    return fetchActiveVendor(session.accessToken);
  }
});
