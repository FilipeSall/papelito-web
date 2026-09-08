import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getHomeCollectionsNav,
  getHomeFeatures,
  getHomePromoMarquee,
} from "./get-home-assets";
import { COLLECTION_NAV_DEFAULTS } from "@/lib/home-collections-nav";
import { FEATURES_BAR_ITEMS } from "@/lib/home-features";

const wpRest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-rest", () => ({ wpRest }));

const TOKEN_ONLY = [{ type: "token", token: "promocao.nome" }];

function marqueeMessage(id: string, text: string, content: unknown = null) {
  return { id, text, content, order: Number(id.at(-1)), isActive: true };
}

function feature(id: string, subtitle: string, subtitleContent: unknown = null) {
  return {
    id,
    title: "Título",
    subtitle,
    subtitleContent,
    iconId: 0,
    iconUrl: "/images/icons/truck.svg",
  };
}

beforeEach(() => {
  wpRest.mockReset();
});

describe("getHomePromoMarquee", () => {
  it("mantém a mensagem composta apenas por tokens", async () => {
    wpRest.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        messages: [
          marqueeMessage("m1", "🏆 A #1 do Brasil"),
          marqueeMessage("m2", "⚡ Oferta"),
          marqueeMessage("m3", "", TOKEN_ONLY),
        ],
      },
    });

    const messages = await getHomePromoMarquee();

    expect(messages).toHaveLength(3);
    expect(messages[2]).toMatchObject({ id: "m3", text: "", content: TOKEN_ONLY });
  });

  it("continua descartando mensagem sem texto e sem conteúdo", async () => {
    wpRest.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        messages: [
          marqueeMessage("m1", "🏆 A #1 do Brasil"),
          marqueeMessage("m2", "⚡ Oferta"),
          marqueeMessage("m3", "🌿 Novidade"),
          marqueeMessage("m4", "   "),
        ],
      },
    });

    const messages = await getHomePromoMarquee();

    expect(messages.map((message) => message.id)).toEqual(["m1", "m2", "m3"]);
  });
});

describe("getHomeFeatures", () => {
  it("não derruba a barra inteira por causa de um subtítulo só com token", async () => {
    wpRest.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        items: [
          feature("frete-gratis", "", TOKEN_ONLY),
          feature("troca-facil", "15 dias para troca"),
          feature("parcelamos", "Em 3x sem juros"),
          feature("envio-rapido", "Sai no mesmo dia"),
        ],
      },
    });

    const items = await getHomeFeatures();

    expect(items).toHaveLength(FEATURES_BAR_ITEMS.length);
    expect(items[0]).toMatchObject({ id: "frete-gratis", subtitleContent: TOKEN_ONLY });
  });

  it("cai no fallback quando um subtítulo fica sem texto e sem conteúdo", async () => {
    wpRest.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        items: [
          feature("frete-gratis", ""),
          feature("troca-facil", "15 dias para troca"),
          feature("parcelamos", "Em 3x sem juros"),
          feature("envio-rapido", "Sai no mesmo dia"),
        ],
      },
    });

    expect(await getHomeFeatures()).toEqual(FEATURES_BAR_ITEMS);
  });
});

function navCard(id: string, order: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: id,
    subtitle: "Sub",
    href: `/${id}`,
    collection: "",
    order,
    isActive: true,
    ...overrides,
  };
}

describe("getHomeCollectionsNav", () => {
  it("respeita a ordem do admin e descarta o card inativo", async () => {
    wpRest.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        items: [
          navCard("terceiro", 3),
          navCard("oculto", 2, { isActive: false }),
          navCard("primeiro", 1),
        ],
      },
    });

    const items = await getHomeCollectionsNav();

    expect(items.map((item) => item.id)).toEqual(["primeiro", "terceiro"]);
  });

  it("descarta o card sem destino interno em vez de derrubar o corredor", async () => {
    wpRest.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        items: [
          navCard("valido", 1),
          navCard("externo", 2, { href: "https://exemplo.com" }),
          navCard("vazio", 3, { title: "  " }),
        ],
      },
    });

    const items = await getHomeCollectionsNav();

    expect(items.map((item) => item.id)).toEqual(["valido"]);
  });

  it("lista vazia é decisão do admin e some da Home", async () => {
    wpRest.mockResolvedValue({ ok: true, status: 200, data: { items: [] } });

    await expect(getHomeCollectionsNav()).resolves.toEqual([]);
  });

  it("cai no corredor de sempre quando o WordPress não responde", async () => {
    wpRest.mockResolvedValue({
      ok: false,
      status: 500,
      error: new Error("indisponível"),
    });

    const items = await getHomeCollectionsNav();

    expect(items.map((item) => item.id)).toEqual(
      COLLECTION_NAV_DEFAULTS.map((item) => item.id),
    );
  });
});
