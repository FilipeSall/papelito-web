import { beforeEach, describe, expect, it, vi } from "vitest";

import { getHomeFlashSale } from "./get-home-flash-sale";

const wpRest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-rest", () => ({ wpRest }));

function campaignResponse() {
  return {
    ok: true,
    status: 200,
    data: {
      campaign: {
        title: "Queimão",
        slug: "queimao",
        status: "active",
        starts_at: "2026-08-04T12:00:00+00:00",
        ends_at: "2026-08-05T12:00:00+00:00",
        productIds: [11794],
        label: "Oferta Relâmpago",
        supportingText: "",
      },
      products: [
        {
          id: "11794",
          name: "Seda Insane Brown King Size",
          category: "Papel",
          badge: "Premium",
          discount: 99,
          originalPrice: 223,
          price: 2.23,
          promotionContext: "contexto-assinado",
        },
      ],
    },
    headers: new Headers(),
  };
}

describe("getHomeFlashSale", () => {
  beforeEach(() => {
    wpRest.mockReset();
  });

  it("devolve a campanha ativa com o contexto promocional assinado", async () => {
    wpRest.mockResolvedValue(campaignResponse());

    const campaign = await getHomeFlashSale();

    expect(campaign).toMatchObject({ slug: "queimao", status: "active", productIds: [11794] });
    expect(campaign?.products[0]).toMatchObject({
      id: "11794",
      discount: 99,
      originalPrice: 223,
      price: 2.23,
      promotionContext: "contexto-assinado",
    });
  });

  it("devolve null quando a campanha não está ativa — expirada não altera preço nenhum", async () => {
    wpRest.mockResolvedValue({
      ok: false,
      status: 404,
      error: { message: "Nenhuma campanha ativa no momento." },
      headers: new Headers(),
    });

    await expect(getHomeFlashSale()).resolves.toBeNull();
  });

  it("devolve null quando a campanha não tem produto válido", async () => {
    const response = campaignResponse();
    response.data.products = [];
    wpRest.mockResolvedValue(response);

    await expect(getHomeFlashSale()).resolves.toBeNull();
  });
});
