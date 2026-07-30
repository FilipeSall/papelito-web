import type { CompanyContext } from "./types/company";

/**
 * Rota única de conclusão do cadastro B2B. O gate em proxy.ts isenta exatamente este caminho;
 * importar a constante (em vez de repetir a string) impede que a lista de isentos divirja da rota.
 */
export const ONBOARDING_PATH = "/cadastro/completar";

/**
 * Destino de quem já tem cadastro completo. É a home: catálogo (`/produtos`) não é landing de
 * pós-autenticação.
 */
export const DEFAULT_POST_ONBOARDING_PATH = "/";

/**
 * Landing única de pós-autenticação. Todo fluxo que autentica (Google OAuth, login por senha,
 * conclusão do cadastro tradicional) manda o usuário para cá em vez de decidir o destino sozinho;
 * a rota lê o contexto do WordPress e despacha para o onboarding ou para o destino final.
 *
 * Centralizar aqui evita que cada tela replique a regra de "cadastro completo" — que era o motivo
 * de o usuário cair em /produtos e só ser barrado depois, ao tentar abrir o perfil.
 */
export const POST_AUTH_PATH = "/pos-login";

export function buildPostAuthUrl(callbackUrl?: string | null): string {
  const safe = resolveSafeCallbackUrl(callbackUrl, "");

  return safe ? `${POST_AUTH_PATH}?callbackUrl=${encodeURIComponent(safe)}` : POST_AUTH_PATH;
}

/**
 * Autoridade única sobre "cadastro incompleto".
 *
 * Deliberadamente ignora `profileComplete`: é usermeta com dois escritores e vira '1' no
 * verify-email mesmo quando o onboarding B2B falhou, então incluí-lo quicaria usuários legados
 * já completos. `onboardingStatus` é derivado ao vivo de memberships + linha de onboarding.
 */
export function requiresB2bOnboarding(
  b2b: { onboardingStatus?: CompanyContext["onboardingStatus"] | string } | null | undefined,
): boolean {
  return b2b?.onboardingStatus === "incomplete" || b2b?.onboardingStatus === "rejected";
}

/**
 * Só aceita destino relativo same-origin. Um callbackUrl absoluto vindo da query permitiria
 * usar o onboarding como open redirect.
 */
export function resolveSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback: string = DEFAULT_POST_ONBOARDING_PATH,
): string {
  if (typeof callbackUrl !== "string" || callbackUrl.length === 0) {
    return fallback;
  }

  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return fallback;
  }

  // Nem o onboarding nem a landing de pós-login podem ser destino de si mesmos.
  for (const reserved of [ONBOARDING_PATH, POST_AUTH_PATH]) {
    if (callbackUrl === reserved || callbackUrl.startsWith(`${reserved}?`)) {
      return fallback;
    }
  }

  return callbackUrl;
}
