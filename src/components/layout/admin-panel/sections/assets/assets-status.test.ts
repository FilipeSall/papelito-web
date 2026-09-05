import { describe, expect, it } from "vitest";

import type { HeroBanner, HomeFeatureItem, PromoMarqueeItem } from "@/types/home-assets";

import {
  ASSET_STATUS,
  attentionSuffix,
  countAttention,
  featureItemStatus,
  heroBannerStatus,
  imageAssetStatus,
  logoStatus,
  marqueeMessageStatus,
} from "./assets-status";

const banner: HeroBanner = {
  alt: "Banner",
  desktopImageId: 1,
  desktopImageUrl: "/desktop.png",
  href: "",
  id: "one",
  isActive: true,
  mobileImageId: 2,
  mobileImageUrl: "/mobile.png",
  order: 1,
};

describe("assets-status", () => {
  it("separa imagem ausente, alt ausente e configurado", () => {
    expect(imageAssetStatus({ alt: "", imageId: 0, imageUrl: "" })).toBe(
      ASSET_STATUS.missingImage,
    );
    expect(imageAssetStatus({ alt: "   ", imageId: 3, imageUrl: "/a.png" })).toBe(
      ASSET_STATUS.missingAlt,
    );
    expect(imageAssetStatus({ alt: "Foto", imageId: 3, imageUrl: "/a.png" })).toBe(
      ASSET_STATUS.configured,
    );
  });

  it("reconhece a imagem que ainda é o padrão do projeto", () => {
    const stillDefault = {
      alt: "Parceira Papelito sorrindo em um ponto de venda.",
      imageId: 0,
      imageUrl: "/images/revendedor/business-main.jpg",
    };

    expect(imageAssetStatus(stillDefault, "revendedorBusinessMain")).toBe(
      ASSET_STATUS.projectDefault,
    );
    expect(imageAssetStatus(stillDefault)).toBe(ASSET_STATUS.configured);
    expect(
      imageAssetStatus(
        { alt: "Foto nova", imageId: 42, imageUrl: "/uploads/nova.png" },
        "revendedorBusinessMain",
      ),
    ).toBe(ASSET_STATUS.configured);
  });

  it("reconhece a logo padrão do projeto como estado legítimo", () => {
    const asDefault = logoStatus("publicHeader", {
      alt: "Papelito",
      imageId: 0,
      imageUrl: "/images/logo.svg",
    });

    expect(asDefault).toBe(ASSET_STATUS.projectDefault);
    expect(asDefault.attention).toBe(false);

    expect(
      logoStatus("publicHeader", { alt: "Papelito", imageId: 9, imageUrl: "/custom.svg" }),
    ).toBe(ASSET_STATUS.configured);
  });

  it("exige as duas imagens da Hero antes de considerar configurada", () => {
    expect(heroBannerStatus(banner)).toBe(ASSET_STATUS.configured);
    expect(heroBannerStatus({ ...banner, mobileImageUrl: "" })).toBe(ASSET_STATUS.missingImage);
    expect(heroBannerStatus({ ...banner, alt: "" })).toBe(ASSET_STATUS.missingAlt);
  });

  it("distingue mensagem ativa, inativa e sem texto", () => {
    const message: PromoMarqueeItem = {
      content: null,
      id: "m1",
      isActive: true,
      order: 1,
      text: "Oferta",
    };

    expect(marqueeMessageStatus(message)).toBe(ASSET_STATUS.active);
    expect(marqueeMessageStatus({ ...message, isActive: false })).toBe(ASSET_STATUS.inactive);
    expect(marqueeMessageStatus({ ...message, text: " " })).toBe(ASSET_STATUS.emptyText);
  });

  it("marca benefício incompleto", () => {
    const item: HomeFeatureItem = {
      iconId: 0,
      iconUrl: "/icon.svg",
      id: "f1",
      subtitle: "Com cupom",
      subtitleContent: null,
      title: "Frete",
    };

    expect(featureItemStatus(item)).toBe(ASSET_STATUS.configured);
    expect(featureItemStatus({ ...item, subtitle: "" })).toBe(ASSET_STATUS.incomplete);
  });

  it("conta apenas os estados que pedem trabalho", () => {
    expect(
      countAttention([
        ASSET_STATUS.configured,
        ASSET_STATUS.projectDefault,
        ASSET_STATUS.missingAlt,
        ASSET_STATUS.missingImage,
      ]),
    ).toBe(2);

    expect(attentionSuffix(0)).toBe("");
    expect(attentionSuffix(1)).toBe(" · 1 precisa de atenção");
    expect(attentionSuffix(2)).toBe(" · 2 precisam de atenção");
  });
});
