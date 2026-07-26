import { describe, expect, it, vi } from "vitest";

const { withAuthMock } = vi.hoisted(() => ({
  lastOptions: undefined as unknown,
  withAuthMock: vi.fn((handler, options) => {
    (globalThis as typeof globalThis & { __withAuthOptions?: unknown }).__withAuthOptions =
      options;
    const wrapped = (request: unknown) => handler(request);
    Object.assign(wrapped, { authOptions: options });
    return wrapped;
  }),
}));

vi.mock("next-auth/middleware", () => ({
  withAuth: withAuthMock,
}));

import { ONBOARDING_PATH } from "./src/features/company/onboarding";
import proxy, { config } from "./proxy";

type TokenOverrides = { role?: string; b2b?: Record<string, unknown> | undefined };

function buildRequest(pathname: string, tokenOverrides: TokenOverrides | string = {}) {
  const overrides: TokenOverrides =
    typeof tokenOverrides === "string" ? { role: tokenOverrides } : tokenOverrides;
  const nextUrl = new URL(`http://localhost${pathname}`) as URL & {
    clone: () => URL;
  };
  nextUrl.clone = () => {
    const cloned = new URL(nextUrl.toString()) as URL & { clone: () => URL };
    cloned.clone = nextUrl.clone;
    return cloned;
  };

  return {
    nextUrl,
    nextauth: {
      token: {
        ...(overrides.role ? { role: overrides.role } : {}),
        ...(overrides.b2b ? { b2b: overrides.b2b } : {}),
      },
    },
  };
}

const INCOMPLETE = { b2b: { onboardingStatus: "incomplete" } } satisfies TokenOverrides;
const COMPLETE = { b2b: { onboardingStatus: "complete" } } satisfies TokenOverrides;

describe("proxy", () => {
  it("allows sellers through to the authoritative checkout policy", async () => {
    const response = (await proxy(
      buildRequest("/checkout", "seller") as never,
      {} as never,
    )) as Response;

		expect(response.headers.get("location")).toBeNull();
		expect(response.status).toBe(200);
  });

  it("allows administrators into admin routes", async () => {
    const response = (await proxy(
      buildRequest("/admin", "administrator") as never,
      {} as never,
    )) as Response;

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });

  it("redirects non-admin users away from admin routes", async () => {
    const response = (await proxy(
      buildRequest("/admin/cupons", "customer") as never,
      {} as never,
    )) as Response;

    expect(response.headers.get("location")).toBe("http://localhost/perfil");
  });

  it("sends users with incomplete B2B onboarding to the completion page", async () => {
    const response = (await proxy(buildRequest("/perfil", INCOMPLETE) as never, {} as never)) as Response;

    expect(response.headers.get("location")).toBe(
      `http://localhost${ONBOARDING_PATH}?callbackUrl=%2Fperfil`,
    );
  });

  it("preserves the original destination, query string included, as callbackUrl", async () => {
    const response = (await proxy(
      buildRequest("/checkout/revisao?cupom=abc", INCOMPLETE) as never,
      {} as never,
    )) as Response;

    expect(response.headers.get("location")).toBe(
      `http://localhost${ONBOARDING_PATH}?callbackUrl=%2Fcheckout%2Frevisao%3Fcupom%3Dabc`,
    );
  });

  it("never gates the onboarding page itself", async () => {
    const response = (await proxy(
      buildRequest(ONBOARDING_PATH, INCOMPLETE) as never,
      {} as never,
    )) as Response;

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });

  it("lets users with completed onboarding through", async () => {
    const response = (await proxy(buildRequest("/perfil", COMPLETE) as never, {} as never)) as Response;

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });

  it("gates vendor routes, which the matcher previously skipped", async () => {
    const response = (await proxy(
      buildRequest("/vendor/pedidos", INCOMPLETE) as never,
      {} as never,
    )) as Response;

    expect(response.headers.get("location")).toBe(
      `http://localhost${ONBOARDING_PATH}?callbackUrl=%2Fvendor%2Fpedidos`,
    );
  });

  it("fails open when the B2B context is missing, leaving purchase blocked server-side", async () => {
    const response = (await proxy(buildRequest("/perfil", {}) as never, {} as never)) as Response;

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });

  it("does not gate on a pending company approval, which has nothing left to fill in", async () => {
    const response = (await proxy(
      buildRequest("/perfil", { b2b: { onboardingStatus: "pending" } }) as never,
      {} as never,
    )) as Response;

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });

  it("keeps the onboarding gate ahead of the admin role check", async () => {
    const response = (await proxy(
      buildRequest("/admin", { role: "administrator", b2b: { onboardingStatus: "incomplete" } }) as never,
      {} as never,
    )) as Response;

    expect(response.headers.get("location")).toBe(
      `http://localhost${ONBOARDING_PATH}?callbackUrl=%2Fadmin`,
    );
  });

  it("registers the expected matcher and authorization callback", () => {
    expect(config.matcher).toEqual([
      "/perfil/:path*",
      "/carrinho",
      "/checkout",
      "/checkout/:path*",
      "/admin/:path*",
      "/vendor/:path*",
      "/cadastro/completar",
    ]);

    // O matcher precisa ser literal para o build do Next; isto impede que ele saia do lugar.
    expect(config.matcher).toContain(ONBOARDING_PATH);

    const wrappedOptions = (
      globalThis as typeof globalThis & {
        __withAuthOptions?: {
          callbacks: {
            authorized: ({ token }: { token: unknown }) => boolean;
          };
        };
      }
    ).__withAuthOptions;
    expect(wrappedOptions).toBeDefined();
    if (!wrappedOptions) {
      throw new Error("withAuth options were not captured.");
    }
    expect(wrappedOptions.callbacks.authorized({ token: null })).toBe(false);
    expect(
      wrappedOptions.callbacks.authorized({
        token: { sub: "42", accessToken: "access-token" },
      }),
    ).toBe(true);
    expect(wrappedOptions.callbacks.authorized({ token: { sub: "42" } })).toBe(false);
    expect(
      wrappedOptions.callbacks.authorized({
        token: { sub: "42", accessToken: "access-token", authError: "invalid_refresh_token" },
      }),
    ).toBe(false);
  });
});
