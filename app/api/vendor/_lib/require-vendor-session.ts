import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isCurrentUserSeller } from "@/lib/server/current-user-role";

export async function requireVendorAccessToken() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return { error: "Nao autenticado.", status: 401 as const };
  }

  if (!(await isCurrentUserSeller(session.accessToken))) {
    return { error: "Acesso restrito a vendors.", status: 403 as const };
  }

  return { accessToken: session.accessToken };
}

/**
 * Versão de leitura de `requireVendorAccessToken`: roda `load` em paralelo com a
 * checagem de papel, que custa um round-trip ao WordPress e dobraria a latência.
 *
 * Não afrouxa a autorização — nada é devolvido antes de o WordPress confirmar
 * que o token é de seller, e `load` usa o access token do próprio usuário. Só
 * para GET: em escrita, o efeito colateral não pode começar antes da autorização.
 */
export async function readWithVendorAccessToken<T>(
  load: (accessToken: string) => Promise<T>,
): Promise<{ data: T } | { error: string; status: 401 | 403 }> {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return { error: "Nao autenticado.", status: 401 };
  }

  const { accessToken } = session;
  const loading = load(accessToken);
  // Sem isto, um 403 deixaria a rejeição de `loading` sem tratamento.
  loading.catch(() => undefined);

  if (!(await isCurrentUserSeller(accessToken))) {
    return { error: "Acesso restrito a vendors.", status: 403 };
  }

  return { data: await loading };
}
