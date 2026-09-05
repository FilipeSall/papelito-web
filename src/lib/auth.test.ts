import { http, HttpResponse } from "msw";
import type { Session } from "next-auth";
import { afterEach, describe, expect, it, vi } from "vitest";

import { server } from "../../test/msw/server";
import { authOptions } from "./auth";

const AUTH_ME_URL = "http://localhost:8080/wp-json/papelito/v1/auth/me";

function makeJwt(exp: number) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");

  return `${header}.${payload}.signature`;
}

async function runJwtCallback(
  token: Record<string, unknown>,
  user?: Record<string, unknown>,
) {
  if (!authOptions.callbacks?.jwt) {
    throw new Error("JWT callback is not configured.");
  }

  return authOptions.callbacks.jwt({
    token,
    trigger: user ? "signIn" : "update",
    session: undefined,
    account: null,
    profile: undefined,
    user,
    isNewUser: false,
  } as unknown as Parameters<NonNullable<typeof authOptions.callbacks.jwt>>[0]);
}

function getCredentialsAuthorize() {
  const provider = authOptions.providers.find(
    (item) => item.id === "credentials",
  ) as {
    options?: {
      authorize?: (credentials: {
        username?: string;
        password?: string;
      }) => Promise<Record<string, unknown> | null>;
    };
  };

  if (!provider?.options?.authorize) {
    throw new Error("Credentials provider is not configured.");
  }

  return provider.options.authorize;
}

describe("authOptions callbacks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps a valid access token and derives its expiration", async () => {
    const accessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);

    const result = await runJwtCallback({
      accessToken,
      refreshToken: "refresh-token",
    });

    expect(result.accessToken).toBe(accessToken);
    expect(result.accessTokenExpires).toBeGreaterThan(Date.now());
    expect(result.role).toBe("customer");
    expect(result.authError).toBeUndefined();
  });

  it("never downgrades the role to customer when /auth/me fails", async () => {
    server.use(
      http.get(AUTH_ME_URL, () => new HttpResponse(null, { status: 500 })),
    );

    const accessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);

    const result = await runJwtCallback({
      accessToken,
      refreshToken: "refresh-token",
    });

    expect(result.role).toBeUndefined();
  });

  it("logs an error when the /auth/me identity lookup fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    server.use(
      http.get(AUTH_ME_URL, () => new HttpResponse(null, { status: 401 })),
    );

    const accessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);

    await runJwtCallback({
      accessToken,
      refreshToken: "refresh-token",
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0]?.[0]).toContain("[auth]");
  });

  it("flags authIdentityError when /auth/me fails, without wiping the session", async () => {
    server.use(
      http.get(AUTH_ME_URL, () => new HttpResponse(null, { status: 500 })),
    );

    const accessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);

    const result = await runJwtCallback({
      accessToken,
      refreshToken: "refresh-token",
    });

    expect(result.authIdentityError).toBe(true);
    expect(result.accessToken).toBe(accessToken);
    expect(result.authError).toBeUndefined();
  });

  it("clears authIdentityError once /auth/me succeeds again", async () => {
    server.use(
      http.get(AUTH_ME_URL, () =>
        HttpResponse.json({ user: { role: "administrator" } }),
      ),
    );

    const accessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);

    const result = await runJwtCallback({
      accessToken,
      refreshToken: "refresh-token",
      authIdentityError: true,
    });

    expect(result.authIdentityError).toBeUndefined();
    expect(result.role).toBe("administrator");
  });

  it("derives the administrator role from a successful /auth/me lookup", async () => {
    server.use(
      http.get(AUTH_ME_URL, () =>
        HttpResponse.json({ user: { role: "administrator" } }),
      ),
    );

    const accessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);

    const result = await runJwtCallback({
      accessToken,
      refreshToken: "refresh-token",
    });

    expect(result.role).toBe("administrator");
  });

  it("propagates incomplete Google B2B onboarding from /auth/me", async () => {
    server.use(
      http.get(AUTH_ME_URL, () =>
        HttpResponse.json({
          user: { role: "customer", profileComplete: false },
          b2b: { onboardingStatus: "incomplete", canPurchase: false },
        }),
      ),
    );

    const result = await runJwtCallback({
      accessToken: makeJwt(Math.floor(Date.now() / 1000) + 3600),
      refreshToken: "refresh-token",
    });

    expect(result.b2b).toMatchObject({
      onboardingStatus: "incomplete",
      canPurchase: false,
    });
  });

  it("re-validates a stale role so a WP role change propagates without logout", async () => {
    server.use(
      http.get(AUTH_ME_URL, () =>
        HttpResponse.json({ user: { role: "administrator" } }),
      ),
    );

    const accessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);

    const result = await runJwtCallback({
      accessToken,
      refreshToken: "refresh-token",
      role: "customer",
      roleCheckedAt: Date.now() - 10 * 60 * 1000,
    });

    expect(result.role).toBe("administrator");
  });

  it("keeps a freshly-checked role without re-fetching /auth/me", async () => {
    let calls = 0;
    server.use(
      http.get(AUTH_ME_URL, () => {
        calls += 1;
        return HttpResponse.json({ user: { role: "administrator" } });
      }),
    );

    const accessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);

    const result = await runJwtCallback({
      accessToken,
      refreshToken: "refresh-token",
      role: "customer",
      roleCheckedAt: Date.now() - 1_000,
    });

    expect(result.role).toBe("customer");
    expect(calls).toBe(0);
  });

  it("revalidates when a fresh role contradicts the internal admin context", async () => {
    let calls = 0;
    server.use(
      http.get(AUTH_ME_URL, () => {
        calls += 1;
        return HttpResponse.json({ user: { role: "administrator" } });
      }),
    );

    const result = await runJwtCallback({
      accessToken: makeJwt(Math.floor(Date.now() / 1000) + 3600),
      refreshToken: "refresh-token",
      role: "customer",
      roleCheckedAt: Date.now() - 1_000,
      b2b: { isInternalAdmin: true },
    });

    expect(result.role).toBe("administrator");
    expect(calls).toBe(1);
  });

  it("refreshes an expired token when a refresh token exists", async () => {
    const accessToken = makeJwt(Math.floor(Date.now() / 1000) - 10);

    const result = await runJwtCallback({
      accessToken,
      accessTokenExpires: Date.now() - 1_000,
      refreshToken: "refresh-token",
    });

    expect(result.accessToken).not.toBe(accessToken);
    expect(result.accessTokenExpires).toBeGreaterThan(Date.now());
    expect(result.authError).toBeUndefined();
  });

  it("overwrites stale identity fields when another user signs in", async () => {
    const accessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600);

    const result = await runJwtCallback(
      {
        id: "1",
        name: "Conta Antiga",
        email: "antiga@example.com",
        picture: "old-avatar.png",
        accessToken: "old-token",
        refreshToken: "old-refresh",
      },
      {
        id: "2",
        name: "Conta Nova",
        email: "nova@example.com",
        image: "new-avatar.png",
        accessToken,
        refreshToken: "new-refresh",
        role: "customer",
      },
    );

    expect(result).toMatchObject({
      id: "2",
      name: "Conta Nova",
      email: "nova@example.com",
      picture: "new-avatar.png",
      accessToken,
      refreshToken: "new-refresh",
      role: "customer",
    });
  });

  it("clears token state when refresh token is missing", async () => {
    const result = await runJwtCallback({
      accessToken: makeJwt(Math.floor(Date.now() / 1000) - 10),
      accessTokenExpires: Date.now() - 1_000,
    });

    expect(result.accessToken).toBeUndefined();
    expect(result.accessTokenExpires).toBeUndefined();
    expect(result.authError).toBe("missing_refresh_token");
  });

  it("clears token state and preserves the auth error when refresh token is invalid", async () => {
    const result = await runJwtCallback({
      accessToken: makeJwt(Math.floor(Date.now() / 1000) - 10),
      accessTokenExpires: Date.now() - 1_000,
      refreshToken: "refresh-invalido",
      role: "customer",
    });

    expect(result.accessToken).toBeUndefined();
    expect(result.accessTokenExpires).toBeUndefined();
    expect(result.refreshToken).toBeUndefined();
    expect(result.role).toBeUndefined();
    expect(result.authError).toBe("invalid_refresh_token");

    const secondPass = await runJwtCallback(result);

    expect(secondPass.authError).toBe("invalid_refresh_token");
    expect(secondPass.accessToken).toBeUndefined();
  });

  it("maps jwt values into the session payload", async () => {
    if (!authOptions.callbacks?.session) {
      throw new Error("Session callback is not configured.");
    }

    const session = await authOptions.callbacks.session({
      session: {
        expires: "2099-01-01T00:00:00.000Z",
        user: {},
      },
      token: {
        sub: "42",
        accessToken: "token",
        accessTokenExpires: 123,
        refreshToken: "refresh",
        authError: "invalid_refresh_token",
        profileComplete: false,
        role: "seller",
      },
      user: undefined,
      newSession: undefined,
      trigger: "update",
    } as unknown as Parameters<
      NonNullable<typeof authOptions.callbacks.session>
    >[0]);

    expect(session).toMatchObject({
      user: { id: "42" },
      accessToken: "token",
      accessTokenExpires: 123,
      authError: "invalid_refresh_token",
      profileComplete: false,
      role: "seller",
    });
    expect(session).not.toHaveProperty("refreshToken");
  });

  it("does not expose a stale role when the identity lookup failed", async () => {
    if (!authOptions.callbacks?.session) {
      throw new Error("Session callback is not configured.");
    }

    const session = (await authOptions.callbacks.session({
      session: {
        expires: "2099-01-01T00:00:00.000Z",
        user: {},
      },
      token: {
        sub: "2158",
        accessToken: "seller-token",
        authIdentityError: true,
        role: "administrator",
      },
      user: undefined,
      newSession: undefined,
      trigger: "update",
    } as unknown as Parameters<
      NonNullable<typeof authOptions.callbacks.session>
    >[0])) as Session;

    expect(session.authIdentityError).toBe(true);
    expect(session.role).toBeUndefined();
  });

  describe("credentials sign-in", () => {
    it("normalizes the email and builds the same canonical B2B context as OAuth", async () => {
      server.use(
        http.get(AUTH_ME_URL, () =>
          HttpResponse.json({
            user: { role: "customer", profileComplete: true },
            b2b: {
              companyId: 7,
              onboardingStatus: "complete",
              canPurchase: true,
            },
          }),
        ),
      );

      const user = await getCredentialsAuthorize()({
        username: "  CLIENTE@PAPELITO.COM ",
        password: "senha-correta",
      });

      expect(user).toMatchObject({
        id: "42",
        email: "cliente@papelito.com",
        role: "customer",
        b2b: { companyId: 7, onboardingStatus: "complete", canPurchase: true },
      });
    });

    it("rejects an unknown email without returning a user", async () => {
      await expect(
        getCredentialsAuthorize()({
          username: "invalido@papelito.com",
          password: "senha-incorreta",
        }),
      ).rejects.toThrow("papelito_invalid_credentials");
    });

    it("rejects an invalid password without returning a user", async () => {
      await expect(
        getCredentialsAuthorize()({
          username: "senha-incorreta@papelito.com",
          password: "senha-incorreta",
        }),
      ).rejects.toThrow("papelito_invalid_credentials");
    });

    /**
     * O rate limit chega como erro GraphQL em HTTP 200. Se voltasse como 429 (era o caso quando o
     * WordPress usava `wp_die`), `wpLogin` marcaria `unavailable` e o motivo se perderia — o
     * usuário leria "serviço indisponível" e o aviso de e-mail não confirmado também sumiria.
     */
    it("distinguishes a rate limited login from a backend outage", async () => {
      await expect(
        getCredentialsAuthorize()({
          username: "muitas-tentativas@papelito.com",
          password: "senha-incorreta",
        }),
      ).rejects.toThrow("papelito_auth_rate_limited");
    });

    it("does not create a partial session when the canonical identity cannot load", async () => {
      server.use(
        http.get(AUTH_ME_URL, () => new HttpResponse(null, { status: 503 })),
      );

      await expect(
        getCredentialsAuthorize()({
          username: "cliente@papelito.com",
          password: "senha-correta",
        }),
      ).rejects.toThrow("papelito_auth_context_unavailable");
    });
  });

  describe("Google sign-in", () => {
    async function runSignIn(user: Record<string, unknown> = {}) {
      if (!authOptions.callbacks?.signIn) {
        throw new Error("signIn callback is not configured.");
      }

      return authOptions.callbacks.signIn({
        user,
        account: {
          provider: "google",
          id_token: "google-id-token",
          type: "oauth",
        },
        profile: undefined,
        email: undefined,
        credentials: undefined,
      } as unknown as Parameters<
        NonNullable<typeof authOptions.callbacks.signIn>
      >[0]);
    }

    it("consulta /auth/me uma única vez por login", async () => {
      let calls = 0;
      server.use(
        http.get(AUTH_ME_URL, () => {
          calls += 1;
          return HttpResponse.json({
            user: { role: "customer", profileComplete: false },
            b2b: { onboardingStatus: "incomplete", canPurchase: false },
          });
        }),
      );

      await expect(runSignIn()).resolves.toBe(true);
      expect(calls).toBe(1);
    });

    it("carrega o contexto B2B no usuário para o gate de proxy.ts poder decidir", async () => {
      server.use(
        http.get(AUTH_ME_URL, () =>
          HttpResponse.json({
            user: { role: "customer", profileComplete: false },
            b2b: { onboardingStatus: "incomplete", canPurchase: false },
          }),
        ),
      );

      const user: Record<string, unknown> = {};
      await runSignIn(user);

      expect(user.b2b).toMatchObject({ onboardingStatus: "incomplete" });
      expect(user.profileComplete).toBe(false);
    });

    it("reaproveita o mesmo usuário do WordPress ao reautenticar com o mesmo e-mail", async () => {
      const first: Record<string, unknown> = {};
      const second: Record<string, unknown> = {};

      await runSignIn(first);
      await runSignIn(second);

      // O WordPress resolve a identidade por email_exists(); o front nunca cria conta.
      expect(first.id).toBe("42");
      expect(second.id).toBe(first.id);
    });

    it("direciona ao cadastro quando o e-mail Google ainda não possui conta", async () => {
      server.use(
        http.post("http://localhost:8080/wp-json/papelito/v1/auth/google", () =>
          HttpResponse.json(
            {
              code: "papelito_pre_account_required",
              message: "Candidatura necessária.",
            },
            { status: 422 },
          ),
        ),
      );

      await expect(runSignIn()).resolves.toBe(
        "/cadastro?feedback=google_account_required",
      );
    });

    it("leva o e-mail Google ao cadastro em ticket opaco", async () => {
      server.use(
        http.post("http://localhost:8080/wp-json/papelito/v1/auth/google", () =>
          HttpResponse.json(
            {
              code: "papelito_pre_account_required",
              message: "Candidatura necessária.",
            },
            { status: 422 },
          ),
        ),
      );

      const result = await runSignIn({ email: "google@example.test" });

      expect(result).toContain(
        "/cadastro?feedback=google_account_required&googleRegistration=",
      );
      expect(result).not.toContain("google@example.test");
    });

    it("does not continue OAuth when the canonical identity cannot load", async () => {
      server.use(
        http.get(AUTH_ME_URL, () => new HttpResponse(null, { status: 503 })),
      );

      await expect(runSignIn()).resolves.toBe(
        "/entrar?error=papelito_auth_context_unavailable",
      );
    });
  });
});
