import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProductBenefits } from "./get-product-benefits";

const wpRest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-rest", () => ({ wpRest }));

function item(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    iconType: "emoji",
    iconEmoji: "🚚",
    iconUrl: "",
    title: "Frete Grátis",
    description: "Com cupom",
    descriptionContent: null,
    ...overrides,
  };
}

beforeEach(() => {
  wpRest.mockReset();
});

describe("getProductBenefits", () => {
  it("pede os benefícios do produto informado", async () => {
    wpRest.mockResolvedValue({ ok: true, status: 200, data: { groupId: 1, source: "global", items: [] } });

    await getProductBenefits(11760);

    expect(wpRest).toHaveBeenCalledWith("/papelito/v1/products/11760/benefits", expect.anything());
  });

  it("preserva a ordem em que o backend resolveu os itens", async () => {
    wpRest.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        groupId: 7,
        source: "collection",
        items: [
          item({ id: 3, title: "Primeiro" }),
          item({ id: 1, title: "Segundo" }),
          item({ id: 2, title: "Terceiro" }),
        ],
      },
    });

    const benefits = await getProductBenefits(11760);

    expect(benefits.items.map((entry) => entry.title)).toEqual([
      "Primeiro",
      "Segundo",
      "Terceiro",
    ]);
    expect(benefits.source).toBe("collection");
  });

  it("aceita qualquer quantidade de itens", async () => {
    for (const total of [2, 3, 4, 7]) {
      wpRest.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          groupId: 1,
          source: "global",
          items: Array.from({ length: total }, (_, index) =>
            item({ id: index + 1, title: `Item ${index + 1}` }),
          ),
        },
      });

      const benefits = await getProductBenefits(11760);

      expect(benefits.items).toHaveLength(total);
    }
  });

  it("descarta item sem ícone utilizável em vez de renderizar texto solto", async () => {
    wpRest.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        groupId: 1,
        source: "global",
        items: [
          item({ id: 1, title: "Válido" }),
          item({ id: 2, title: "Sem emoji", iconEmoji: "" }),
          item({ id: 3, title: "SVG sem url", iconType: "svg", iconEmoji: "", iconUrl: "" }),
        ],
      },
    });

    const benefits = await getProductBenefits(11760);

    expect(benefits.items.map((entry) => entry.title)).toEqual(["Válido"]);
  });

  it("normaliza origem desconhecida para none", async () => {
    wpRest.mockResolvedValue({
      ok: true,
      status: 200,
      data: { groupId: 1, source: "inventada", items: [] },
    });

    expect((await getProductBenefits(11760)).source).toBe("none");
  });

  it("devolve vazio quando o backend falha, sem cópia comercial de fallback", async () => {
    wpRest.mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: "erro", message: "Falhou." },
    });

    const benefits = await getProductBenefits(11760);

    expect(benefits.items).toEqual([]);
    expect(benefits.source).toBe("none");
  });

  it("não consulta o backend com id inválido", async () => {
    expect((await getProductBenefits("abc")).source).toBe("none");
    expect(wpRest).not.toHaveBeenCalled();
  });
});
