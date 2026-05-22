import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

import type { ActiveVendorError, AvailableVendor } from "../types/active-vendor";
import { mapAvailableVendor, type WpAvailableVendor } from "./wp-mappers";

export type AvailableVendorsResult =
  | { ok: true; vendors: AvailableVendor[] }
  | { ok: false; error: ActiveVendorError };

export async function getAvailableVendors(): Promise<AvailableVendorsResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return {
      ok: false,
      error: { reason: "unauthenticated", message: "Usuário não autenticado." },
    };
  }

  const result = await wpRest<WpAvailableVendor[]>("/papelito/v1/profile/me/available-vendors", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (result.ok) {
    return { ok: true, vendors: result.data.map(mapAvailableVendor) };
  }

  if (result.error.code === "papelito_account_cep_missing") {
    return {
      ok: false,
      error: {
        reason: "missing_cep",
        message: "Cadastre um CEP na sua conta para ver vendors da sua região.",
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
