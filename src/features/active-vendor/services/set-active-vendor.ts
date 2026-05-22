import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

import type { ActiveVendor, ActiveVendorError } from "../types/active-vendor";
import { mapActiveVendor, type WpActiveVendor } from "./wp-mappers";

export type SetActiveVendorResult =
  | { ok: true; vendor: ActiveVendor }
  | { ok: false; error: ActiveVendorError };

export async function setActiveVendor(vendorId: number): Promise<SetActiveVendorResult> {
  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return {
      ok: false,
      error: { reason: "unknown", message: "Vendor inválido." },
    };
  }

  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return {
      ok: false,
      error: { reason: "unauthenticated", message: "Usuário não autenticado." },
    };
  }

  const result = await wpRest<WpActiveVendor>("/papelito/v1/profile/me/active-vendor", {
    method: "PUT",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    json: { vendor_id: vendorId },
  });

  if (result.ok) {
    return { ok: true, vendor: mapActiveVendor(result.data) };
  }

  const code = result.error.code;

  if (code === "papelito_account_cep_missing") {
    return {
      ok: false,
      error: {
        reason: "missing_cep",
        message: "Cadastre um CEP na sua conta para escolher um vendor.",
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
