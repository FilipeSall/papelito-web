import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
import { TEST_DEPLOYMENT_READ_ONLY_MESSAGE } from "./src/lib/read-only-deployment";
import proxy, { config } from "./proxy";

type TokenOverrides = {
  accessToken?: string;
  role?: string;
  b2b?: Record<string, unknown> | undefined;
};

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
    method: "GET",
    headers: new Headers({ host: nextUrl.host }),
    nextUrl,
    nextauth: {
      token: {
        ...(overrides.role ? { role: overrides.role } : {}),
        ...(overrides.accessToken ? { accessToken: overrides.accessToken } : {}),
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

  it.each(["customer", "seller", "administrator"])(
    "sends a logged-in %s from the revendedor signup to the completion page",
    async (role) => {
      const response = (await proxy(
        buildRequest("/revendedor", { accessToken: "access-token", role, b2b: { onboardingStatus: "complete" } }) as never,
        {} as never,
      )) as Response;

      expect(response.headers.get("location")).toBe(
        "http://localhost/cadastro/completar?callbackUrl=%2F",
      );
    },
  );

  it("lets visitors open the revendedor signup", async () => {
    const response = (await proxy(buildRequest("/revendedor") as never, {} as never)) as Response;

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

  it("sends authenticated users from public registration to B2B onboarding", async () => {
    const response = (await proxy(
      buildRequest("/cadastro?callbackUrl=%2F", { accessToken: "access-token" }) as never,
      {} as never,
    )) as Response;

    expect(response.headers.get("location")).toBe(
      `http://localhost${ONBOARDING_PATH}?callbackUrl=%2F`,
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

  describe("on a Vercel deployment", () => {
    beforeEach(() => {
      vi.stubEnv("VERCEL_ENV", "production");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    function apiRequest(method: string, host: string, pathname: string) {
      return {
        method,
        headers: new Headers({ host }),
        nextUrl: new URL(`https://${host}${pathname}`),
        nextauth: { token: null },
      };
    }

    it("refuses writes from the vercel.app alias, which shares the production WordPress", async () => {
      const response = (await proxy(
        apiRequest("POST", "papelito-web.vercel.app", "/api/company-applications") as never,
        {} as never,
      )) as Response;

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        code: "test_environment_read_only",
        message: TEST_DEPLOYMENT_READ_ONLY_MESSAGE,
      });
    });

    it("lets the vercel.app alias read the API without a session", async () => {
      const response = (await proxy(
        apiRequest("GET", "papelito-web.vercel.app", "/api/company-applications") as never,
        {} as never,
      )) as Response;

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("lets the production domain write, leaving authorization to the route", async () => {
      const response = (await proxy(
        apiRequest("POST", "marketplace.papelito.com", "/api/checkout/place-order") as never,
        {} as never,
      )) as Response;

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  });

  it("registers the expected matcher and authorization callback", () => {
    expect(config.matcher).toEqual([
      "/perfil/:path*",
      "/carrinho",
      "/checkout",
      "/checkout/:path*",
      "/admin/:path*",
      "/vendor/:path*",
      "/cadastro",
      "/revendedor",
      "/cadastro/completar",
      "/api/:path*",
    ]);

    // O matcher precisa ser literal para o build do Next; isto impede que ele saia do lugar.
    expect(config.matcher).toContain(ONBOARDING_PATH);

    const wrappedOptions = (
      globalThis as typeof globalThis & {
        __withAuthOptions?: {
        callbacks: {
            authorized: ({ token, req }: { token: unknown; req: unknown }) => boolean;
        };
        };
      }
    ).__withAuthOptions;
    expect(wrappedOptions).toBeDefined();
    if (!wrappedOptions) {
      throw new Error("withAuth options were not captured.");
    }
    expect(
      wrappedOptions.callbacks.authorized({ token: null, req: { nextUrl: { pathname: "/perfil" } } }),
    ).toBe(false);
    expect(
      wrappedOptions.callbacks.authorized({ token: null, req: { nextUrl: { pathname: "/cadastro" } } }),
    ).toBe(true);
    expect(
      wrappedOptions.callbacks.authorized({ token: null, req: { nextUrl: { pathname: "/revendedor" } } }),
    ).toBe(true);
    expect(
      wrappedOptions.callbacks.authorized({
        token: { sub: "42", accessToken: "access-token" },
        req: { nextUrl: { pathname: "/perfil" } },
      }),
    ).toBe(true);
    expect(
      wrappedOptions.callbacks.authorized({
        token: { sub: "42" },
        req: { nextUrl: { pathname: "/perfil" } },
      }),
    ).toBe(false);
    expect(
      wrappedOptions.callbacks.authorized({
        token: { sub: "42", accessToken: "access-token", authError: "invalid_refresh_token" },
        req: { nextUrl: { pathname: "/perfil" } },
      }),
    ).toBe(false);
  });
});
