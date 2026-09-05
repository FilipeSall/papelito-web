import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminApiSessionMock = vi.fn();
const backfillAdminProductSkusMock = vi.fn();
const revalidateTagMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
}));

vi.mock("@/lib/server/admin-api-auth", () => ({
  getAdminApiSession: () => getAdminApiSessionMock(),
}));

vi.mock("@/lib/server/admin-products", () => ({
  backfillAdminProductSkus: (...args: unknown[]) => backfillAdminProductSkusMock(...args),
}));

describe("POST /api/admin/products/sku-backfill", () => {
  beforeEach(() => {
    getAdminApiSessionMock.mockReset();
    backfillAdminProductSkusMock.mockReset();
    revalidateTagMock.mockReset();
    getAdminApiSessionMock.mockResolvedValue({ accessToken: "token" });
  });

  it("previews missing SKUs with the server-side admin session", async () => {
    const summary = { dryRun: true, generated: 0, missing: 1 };
    backfillAdminProductSkusMock.mockResolvedValue(summary);
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/admin/products/sku-backfill", {
        body: JSON.stringify({ batch: 100, dryRun: true }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(summary);
    expect(backfillAdminProductSkusMock).toHaveBeenCalledWith("token", {
      batch: 100,
      dryRun: true,
    });
  });

  it("returns the auth error without calling WordPress", async () => {
    getAdminApiSessionMock.mockResolvedValue({ error: "Não autorizado.", status: 401 });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/admin/products/sku-backfill", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(backfillAdminProductSkusMock).not.toHaveBeenCalled();
  });
});
