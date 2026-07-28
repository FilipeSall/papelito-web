import "server-only";

import { getServerSession } from "next-auth";

import type { CompanyContext } from "@/features/company/types/company";
import { authOptions } from "@/lib/auth";

import { wpRest, type WpRestResult } from "./wp-rest";

export type { CompanyContext } from "@/features/company/types/company";

export type UserApiSession = { accessToken: string } | { error: string; status: 401 };

/**
 * Sessão autenticada mínima para as rotas do painel da empresa. Não confere role — a autorização
 * B2B é feita inteiramente no WordPress (matriz RBAC recarregada por mutação).
 */
export async function getUserApiSession(): Promise<UserApiSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return { error: "Não autenticado.", status: 401 };
  }

  return { accessToken: session.accessToken };
}

/**
 * Busca o contexto da empresa ativa server-side com o token do usuário.
 */
export async function fetchCompanyContext(
  accessToken: string,
): Promise<WpRestResult<CompanyContext>> {
  return wpRest<CompanyContext>("/papelito/v1/companies/current", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
