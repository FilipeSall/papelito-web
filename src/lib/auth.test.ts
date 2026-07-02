import { afterEach, describe, expect, it, vi } from "vitest";

import { authOptions } from "./auth";

function makeJwt(exp: number) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  );
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
    } as unknown as Parameters<NonNullable<typeof authOptions.callbacks.session>>[0]);

    expect(session).toMatchObject({
      user: { id: "42" },
      accessToken: "token",
      accessTokenExpires: 123,
      refreshToken: "refresh",
      authError: "invalid_refresh_token",
      profileComplete: false,
      role: "seller",
    });
  });
});
