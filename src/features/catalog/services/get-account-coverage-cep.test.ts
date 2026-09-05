import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const getServerSessionMock = vi.fn();
const fetchCompanyContextMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (callback: (...args: Array<never>) => unknown) => callback,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/server/env", () => ({
  getWpGraphqlEndpoint: () => "http://wp.test/graphql",
}));

vi.mock("@/lib/server/company-api", () => ({
  fetchCompanyContext: (...args: unknown[]) => fetchCompanyContextMock(...args),
}));

describe("getAccountCoverageCepContext", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    getServerSessionMock.mockReset();
    fetchCompanyContextMock.mockReset();
    fetchCompanyContextMock.mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("uses shipping postcode as fallback when the customer metadata cep is empty", async () => {
    getServerSessionMock.mockResolvedValue({
      accessToken: "token",
      user: {
        id: "42",
        email: "customer@example.com",
      },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          customer: {
            billing: {
              postcode: "",
            },
            metaData: [
              {
                key: "cep",
                value: "",
              },
            ],
            shipping: {
              postcode: "01310-930",
            },
          },
        },
      }),
    });

    const { getAccountCoverageCepContext } =
      await import("./get-account-coverage-cep");
    const context = await getAccountCoverageCepContext();

    expect(context).toEqual({
      isAuthenticated: true,
      cep: "01310930",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://wp.test/graphql",
      expect.objectContaining({
        body: expect.stringContaining("shipping"),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://wp.test/graphql",
      expect.objectContaining({
        body: expect.stringContaining("billing"),
      }),
    );
  });

  it("uses the active company fiscal postcode before customer addresses", async () => {
    getServerSessionMock.mockResolvedValue({
      accessToken: "token",
      user: { id: "42", email: "customer@example.com" },
    });
    fetchCompanyContextMock.mockResolvedValue({
      ok: true,
      data: { company: { fiscalAddress: { cep: "30130-010" } } },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          customer: {
            billing: { postcode: "22041-001" },
            metaData: [{ key: "cep", value: "01310-930" }],
            shipping: { postcode: "04101-000" },
          },
        },
      }),
    });

    const { getAccountCoverageCepContext } =
      await import("./get-account-coverage-cep");
    await expect(getAccountCoverageCepContext()).resolves.toEqual({
      isAuthenticated: true,
      cep: "30130010",
    });
  });
});
