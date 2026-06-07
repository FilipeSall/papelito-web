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
    ...sessionOverrides,
    user,
  };
}
