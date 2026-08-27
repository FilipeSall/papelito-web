import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { fetchCurrentUserRole } from "./current-user-role";

export type AdminApiSession =
  | { accessToken: string }
  | { error: string; status: 401 | 403 };

export async function getAdminApiSession(): Promise<AdminApiSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return { error: "Não autenticado.", status: 401 };
  }

  if ((await fetchCurrentUserRole(session.accessToken)) !== "administrator") {
    return { error: "Acesso negado.", status: 403 };
  }

  return { accessToken: session.accessToken };
}

/**
 * Roda `load` em paralelo com a checagem de papel, para leituras em que o custo do
 * guard (um round-trip ao WordPress) dobraria a latência.
 *
 * Não afrouxa a autorização: `load` usa o access token do próprio usuário, o
 * WordPress continua aplicando as permissões dele, e nada é devolvido antes de o
 * guard confirmar `administrator`. Use apenas em GET — para escrita, o efeito
 * colateral não pode começar antes da autorização.
 */
export async function readWithAdminApiSession<T>(
  load: (accessToken: string) => Promise<T>,
): Promise<{ data: T } | { error: string; status: 401 | 403 }> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return { error: "Não autenticado.", status: 401 };
  }

  const { accessToken } = session;
  const loading = load(accessToken);
  // Sem isto, um 403 deixaria a rejeição de `loading` sem tratamento.
  loading.catch(() => undefined);

  if ((await fetchCurrentUserRole(accessToken)) !== "administrator") {
    return { error: "Acesso negado.", status: 403 };
  }

  return { data: await loading };
}
