import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const appBaseMock = vi.fn<() => string | undefined>();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/env", () => ({ getWpRestBase: () => "https://wp.example/wp-json" }));
vi.mock("@/lib/server/app-url", () => ({ getAppBaseUrlOrUndefined: () => appBaseMock() }));

const fetchMock = vi.fn();

function sentHeaders(): Record<string, string> {
  return (fetchMock.mock.calls[0]?.[1]?.headers ?? {}) as Record<string, string>;
}

describe("wpRest — domínio da implantação", () => {
  beforeEach(() => {
    appBaseMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("informa ao WordPress de qual frontend veio a chamada", async () => {
    appBaseMock.mockReturnValue("https://papelito-web.vercel.app");
    const { wpRest } = await import("./wp-rest");

    await wpRest("/papelito/v1/coverage/products");

    expect(sentHeaders()["X-Papelito-Frontend-Base"]).toBe("https://papelito-web.vercel.app");
  });

  it("sem domínio resolvido não inventa o cabeçalho", async () => {
    appBaseMock.mockReturnValue(undefined);
    const { wpRest } = await import("./wp-rest");

    await wpRest("/papelito/v1/coverage/products");

    expect(sentHeaders()).not.toHaveProperty("X-Papelito-Frontend-Base");
  });

  it("cabeçalho explícito de quem chama vence o padrão", async () => {
    appBaseMock.mockReturnValue("https://papelito-web.vercel.app");
    const { wpRest } = await import("./wp-rest");

    await wpRest("/papelito/v1/checkout/place-order", { headers: { "X-Papelito-Frontend-Base": "https://marketplace.papelito.com" } });

    expect(sentHeaders()["X-Papelito-Frontend-Base"]).toBe("https://marketplace.papelito.com");
  });
});
