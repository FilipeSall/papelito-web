import { beforeEach, describe, expect, it, vi } from "vitest";

const getSellerAccessTokenMock = vi.fn();
const wpRestMock = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/vendor-session", () => ({
  getSellerAccessToken: () => getSellerAccessTokenMock(),
}));
vi.mock("@/lib/server/wp-rest", () => ({
  wpRest: (...args: unknown[]) => wpRestMock(...args),
}));

describe("getVendorEligibility", () => {
  beforeEach(() => {
    getSellerAccessTokenMock.mockReset().mockResolvedValue("token");
    wpRestMock.mockReset();
  });

  it("lê o requisito payment_gateway com os gateways aptos, ao lado do legado", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        can_sell: false,
        requirements: [
          { id: "account", satisfied: true, blocking: false, advisory: false, reason: "" },
          { id: "payment_gateway", satisfied: false, blocking: true, advisory: false, reason: "no_gateway_ready", providers: [] },
          { id: "pagarme", satisfied: true, blocking: false, advisory: false, reason: "" },
          { id: "desconhecido", satisfied: false, blocking: true, reason: "x" },
        ],
      },
    });
    const { getVendorEligibility } = await import("./get-vendor-eligibility");

    const eligibility = await getVendorEligibility();

    expect(eligibility.requirements.map((item) => item.id)).toEqual(["account", "payment_gateway", "pagarme"]);
    expect(eligibility.requirements[1]).toMatchObject({ reason: "no_gateway_ready", providers: [], blocking: true });
  });

  it("guarda só os nomes de gateway que são texto", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { requirements: [{ id: "payment_gateway", satisfied: true, providers: ["mercadopago", 7] }] },
    });
    const { getVendorEligibility } = await import("./get-vendor-eligibility");

    expect((await getVendorEligibility()).requirements[0].providers).toEqual(["mercadopago"]);
  });
});
