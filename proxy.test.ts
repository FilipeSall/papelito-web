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

import proxy, { config } from "./proxy";

function buildRequest(pathname: string, role?: string) {
  const nextUrl = new URL(`http://localhost${pathname}`) as URL & {
    clone: () => URL;
  };
  nextUrl.clone = () => new URL(nextUrl.toString());

  return {
    nextUrl,
    nextauth: {
      token: role ? { role } : {},
    },
  };
}

describe("proxy", () => {
  it("redirects sellers away from checkout routes", async () => {
    const response = (await proxy(
      buildRequest("/checkout", "seller") as never,
      {} as never,
    )) as Response;

    expect(response.headers.get("location")).toBe("http://localhost/perfil");
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

  it("registers the expected matcher and authorization callback", () => {
    expect(config.matcher).toEqual([
      "/perfil/:path*",
      "/carrinho",
      "/checkout",
      "/checkout/:path*",
      "/admin/:path*",
    ]);

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
