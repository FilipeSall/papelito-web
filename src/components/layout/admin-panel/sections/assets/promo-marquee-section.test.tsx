import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { HomeFeatureItem, PromoMarqueeItem } from "@/types/home-assets";

import { PromoMarqueeSection } from "./promo-marquee-section";

const messages: PromoMarqueeItem[] = [
  { id: "one", text: "⚡ Oferta", order: 1, isActive: true },
];

const features: HomeFeatureItem[] = [
  { id: "one", title: "Frete", subtitle: "Acima de R$500", iconId: 0, iconUrl: "/images/icons/truck.svg" },
  { id: "two", title: "Troca", subtitle: "15 dias", iconId: 0, iconUrl: "/images/icons/refresh.svg" },
  { id: "three", title: "Parcelamos", subtitle: "Em 3x", iconId: 0, iconUrl: "/images/icons/price.svg" },
  { id: "four", title: "Envio", subtitle: "Hoje", iconId: 0, iconUrl: "/images/icons/thunder.svg" },
];

describe("PromoMarqueeSection", () => {
  it("provides a control to collapse and expand the Home section", async () => {
    const user = userEvent.setup();

    render(
      <PromoMarqueeSection
        featureItems={features}
        featureIssues={[]}
        featureUploadingId={null}
        isSaving={false}
        isSavingFeatures={false}
        issues={[]}
        messages={messages}
        onAdd={vi.fn()}
        onChange={vi.fn()}
        onFeatureChange={vi.fn()}
        onFeatureSave={vi.fn()}
        onFeatureUploadIcon={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    const toggle = screen.getByRole("button", { name: /expandir faixa de avisos e promoções/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(screen.getByRole("button", { name: /recolher faixa de avisos e promoções/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /recolher faixa de avisos e promoções/i }));
    expect(screen.getByRole("button", { name: /expandir faixa de avisos e promoções/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
