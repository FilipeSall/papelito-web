import type { Session } from "next-auth";

export function buildSession(
  overrides: Partial<Session> & {
    user?: Partial<NonNullable<Session["user"]>>;
  } = {},
): Session {
  const { user: userOverrides, ...sessionOverrides } = overrides;
  const user = {
    id: "42",
    email: "cliente@papelito.com",
    name: "Cliente Papelito",
    image: null,
    ...(userOverrides ?? {}),
  };

  return {
    expires: "2099-01-01T00:00:00.000Z",
    accessToken: "access-token",
    accessTokenExpires: Date.now() + 60 * 60 * 1000,
    refreshToken: "refresh-token",
    authError: undefined,
    profileComplete: true,
    role: "customer",
    b2b: { onboardingStatus: "complete", canPurchase: true },
    ...sessionOverrides,
    user,
  };
}

/**
 * Usuário autenticado cujo onboarding B2B ainda não terminou — o cohort que o gate de proxy.ts
 * manda para /cadastro/completar.
 */
export function buildIncompleteB2bSession(
  overrides: Parameters<typeof buildSession>[0] = {},
): Session {
  return buildSession({
    profileComplete: false,
    b2b: {
      onboardingStatus: "incomplete",
      canPurchase: false,
      requiresB2bOnboarding: true,
      identityStatus: "incomplete",
      onboarding: {
        type: "google_onboarding",
        targetCnpj: null,
        cpfLast4: null,
        hasBirthDate: false,
      },
    },
    ...overrides,
  });
}
