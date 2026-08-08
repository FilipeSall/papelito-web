import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EMPTY_RICH_TEXT_CONTEXT } from "@/features/rich-text";
import { describe, expect, it, vi } from "vitest";

import type { HomeFeatureItem, PromoMarqueeItem } from "@/types/home-assets";

import { PromoMarqueeSection } from "./promo-marquee-section";

const messages: PromoMarqueeItem[] = [
  { id: "one", text: "⚡ Oferta", content: null, order: 1, isActive: true },
];

const messagesWithToken: PromoMarqueeItem[] = [
  {
    id: "frete",
    text: "🔥 FRETE GRÁTIS a partir de  com cupom",
    content: [
      { type: "text", text: "🔥 FRETE GRÁTIS a partir de " },
      { type: "token", token: "frete_gratis.minimo" },
      { type: "text", text: " com cupom" },
    ],
    order: 1,
    isActive: true,
  },
];

const features: HomeFeatureItem[] = [
  { id: "one", title: "Frete", subtitle: "Com cupom", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/truck.svg" },
  { id: "two", title: "Troca", subtitle: "15 dias", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/refresh.svg" },
  { id: "three", title: "Parcelamos", subtitle: "Em 3x", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/price.svg" },
  { id: "four", title: "Envio", subtitle: "Hoje", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/thunder.svg" },
];

describe("PromoMarqueeSection", () => {
  it("provides a control to collapse and expand the Home section", async () => {
    const user = userEvent.setup();

    render(
      <PromoMarqueeSection
        featureItems={features}
        featureIssues={[]}
        featureUploadingId={null}
        richTextContext={EMPTY_RICH_TEXT_CONTEXT}
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

  it("resolve o token na prévia enquanto o editor mostra o chip", async () => {
    const user = userEvent.setup();

    render(
      <PromoMarqueeSection
        featureItems={features}
        featureIssues={[]}
        featureUploadingId={null}
        richTextContext={{ ...EMPTY_RICH_TEXT_CONTEXT, freeShippingMinimumCents: 9900 }}
        isSaving={false}
        isSavingFeatures={false}
        issues={[]}
        messages={messagesWithToken}
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

    await user.click(screen.getByRole("button", { name: /expandir faixa de avisos e promoções/i }));

    expect(screen.getAllByText("Frete grátis cupom").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("🔥 FRETE GRÁTIS a partir de R$ 99,00 com cupom").length,
    ).toBeGreaterThan(0);
  });

  it("avisa que a mensagem ficaria oculta quando o dado dinâmico não existe", async () => {
    const user = userEvent.setup();

    render(
      <PromoMarqueeSection
        featureItems={features}
        featureIssues={[]}
        featureUploadingId={null}
        richTextContext={EMPTY_RICH_TEXT_CONTEXT}
        isSaving={false}
        isSavingFeatures={false}
        issues={[]}
        messages={messagesWithToken}
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

    await user.click(screen.getByRole("button", { name: /expandir faixa de avisos e promoções/i }));

    expect(screen.getAllByText(/esta mensagem ficaria oculta no site/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/a faixa ficará oculta sem mensagens ativas/i)).toBeInTheDocument();
  });
});
