import { beforeEach, describe, expect, it, vi } from "vitest";

const requireVendorAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();
const revalidateTagMock = vi.fn();

vi.mock("./require-vendor-session", () => ({
  requireVendorAccessToken: () => requireVendorAccessTokenMock(),
}));

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

vi.mock("next/cache", () => ({ revalidateTag: (...args: unknown[]) => revalidateTagMock(...args) }));

describe("proxyVendorJson", () => {
  beforeEach(() => {
    requireVendorAccessTokenMock.mockReset();
    wpRestMock.mockReset();
    revalidateTagMock.mockReset();
    requireVendorAccessTokenMock.mockResolvedValue({ accessToken: "vendor-token" });
  });

  it("repassa com o token do vendor e sem cache", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: { ok: 1 } });
    const { proxyVendorJson } = await import("./proxy-vendor-json");

    const response = await proxyVendorJson({ path: "/papelito/v1/vendor/payment-gateways", method: "GET" });

    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/vendor/payment-gateways",
      expect.objectContaining({ method: "GET", headers: { Authorization: "Bearer vendor-token" }, cache: "no-store" }),
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({ ok: 1 });
  });

  it("mutação bem-sucedida invalida as tags informadas", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: {} });
    const { proxyVendorJson } = await import("./proxy-vendor-json");

    await proxyVendorJson({ path: "/x", method: "PUT", json: { a: 1 }, revalidate: ["vendor-payment-gateways"] });

    expect(revalidateTagMock).toHaveBeenCalledWith("vendor-payment-gateways", "max");
  });

  it("resposta que não passa no parser vira 502", async () => {
    wpRestMock.mockResolvedValue({ ok: true, status: 200, data: { lixo: true } });
    const { proxyVendorJson } = await import("./proxy-vendor-json");

    const response = await proxyVendorJson({ path: "/x", method: "GET", parse: () => null });

    expect(response.status).toBe(502);
  });

  it("erro do WordPress mantém status e código", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 409, error: { code: "papelito_financial_profile_version_conflict", message: "x" } });
    const { proxyVendorJson } = await import("./proxy-vendor-json");

    const response = await proxyVendorJson({ path: "/x", method: "PATCH", json: {} });

    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("papelito_financial_profile_version_conflict");
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("sem sessão de vendor não chama o WordPress", async () => {
    requireVendorAccessTokenMock.mockResolvedValue({ error: "Nao autenticado.", status: 401 });
    const { proxyVendorJson } = await import("./proxy-vendor-json");

    const response = await proxyVendorJson({ path: "/x", method: "GET" });

    expect(response.status).toBe(401);
    expect(wpRestMock).not.toHaveBeenCalled();
  });
});
