import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

import type { ActiveVendor, ActiveVendorError } from "../types/active-vendor";
import { mapActiveVendor, type WpActiveVendor } from "./wp-mappers";

export type ActiveVendorResult =
  | { ok: true; vendor: ActiveVendor }
  | { ok: false; error: ActiveVendorError };

export async function getActiveVendor(): Promise<ActiveVendorResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return {
      ok: false,
      error: { reason: "unauthenticated", message: "Usuário não autenticado." },
    };
  }

  const result = await wpRest<WpActiveVendor>("/papelito/v1/profile/me/active-vendor", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
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
