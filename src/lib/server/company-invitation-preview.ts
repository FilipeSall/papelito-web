import "server-only";

import { cookies } from "next/headers";

import { wpRest, type WpRestError } from "@/lib/server/wp-rest";

const INVITE_COOKIE = "papelito_invite_token";

export type PendingInvitationResult =
  | { kind: "none" }
  | { kind: "ok"; companyName: string; payload: Record<string, unknown> }
  | { kind: "error"; error: WpRestError; status: number };

/**
 * Preview do convite pendente.
 *
 * O token vive apenas em cookie HttpOnly: o navegador não consegue nem saber se há convite, então
 * perguntar isso do cliente gerava um 404 garantido em toda navegação do perfil. Sem cookie não há
 * convite e não há requisição.
 *
 * Devolve o payload do WordPress inteiro porque o cadastro por convite consome campos que este
 * módulo não precisa conhecer (`accountExists`, `authMethods`).
 */
export async function getPendingInvitationPreview(): Promise<PendingInvitationResult> {
  const token = (await cookies()).get(INVITE_COOKIE)?.value;

  if (!token) {
    return { kind: "none" };
  }

  const result = await wpRest<Record<string, unknown>>(
    `/papelito/v1/company-invitations/${encodeURIComponent(token)}`,
  );

  if (!result.ok) {
    return { kind: "error", error: result.error, status: result.status };
  }

  const payload = result.data ?? {};
  const companyName = typeof payload.companyName === "string" ? payload.companyName : "";

  return { kind: "ok", companyName, payload };
}
