import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EMPTY_RICH_TEXT_CONTEXT } from "@/features/rich-text";
import { describe, expect, it, vi } from "vitest";

import type { HomeFeatureItem } from "@/types/home-assets";

import { HomeFeaturesSection } from "./home-features-section";

const items: HomeFeatureItem[] = [
  { id: "one", title: "Frete Grátis", subtitle: "Com cupom", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/truck.svg" },
  { id: "two", title: "Troca Fácil", subtitle: "15 dias para troca", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/refresh.svg" },
  { id: "three", title: "Parcelamos", subtitle: "Em 3x sem juros", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/price.svg" },
  { id: "four", title: "Envio Rápido", subtitle: "Sai no mesmo dia", subtitleContent: null, iconId: 0, iconUrl: "/images/icons/thunder.svg" },
];

describe("HomeFeaturesSection", () => {
  it("edits text, validates empty values and exposes SVG upload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const view = render(
      <HomeFeaturesSection
        richTextContext={EMPTY_RICH_TEXT_CONTEXT}
        isSaving={false}
        issues={[]}
        items={items}
        onChange={onChange}
        onSave={vi.fn()}
        onUploadIcon={vi.fn()}
        uploadingId={null}
      />,
    );

    expect(screen.getByRole("button", { name: /salvar benefícios/i })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /expandir benefício 1/i }));
    expect(screen.getByLabelText("Enviar ícone do benefício 1")).toHaveAttribute("accept", "image/svg+xml,.svg");

    await user.clear(document.getElementById("home-feature-title-one") as HTMLInputElement);
    view.rerender(
      <HomeFeaturesSection
        richTextContext={EMPTY_RICH_TEXT_CONTEXT}
        isSaving={false}
        issues={[]}
        items={items.map((item) => (item.id === "one" ? { ...item, title: "" } : item))}
        onChange={onChange}
        onSave={vi.fn()}
        onUploadIcon={vi.fn()}
        uploadingId={null}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/preencha título/i);
    expect(screen.getByRole("button", { name: /salvar benefícios/i })).toBeDisabled();
    expect(onChange).toHaveBeenCalledWith("one", { title: "" });
  });

  it("resolve o token na prévia enquanto o editor mostra o chip", async () => {
    const tokenItems = items.map((item) =>
      item.id === "one"
        ? {
            ...item,
            subtitle: "A partir de  com cupom",
            subtitleContent: [
              { type: "text" as const, text: "A partir de " },
              { type: "token" as const, token: "frete_gratis.minimo" },
              { type: "text" as const, text: " com cupom" },
            ],
          }
        : item,
    );

    const user = userEvent.setup();
    render(
      <HomeFeaturesSection
        richTextContext={{ ...EMPTY_RICH_TEXT_CONTEXT, freeShippingMinimumCents: 12550 }}
        isSaving={false}
        issues={[]}
        items={tokenItems}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onUploadIcon={vi.fn()}
        uploadingId={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /expandir benefício 1/i }));
    expect(screen.getAllByText("Frete grátis cupom").length).toBeGreaterThan(0);
    expect(screen.getAllByText("A partir de R$ 125,50 com cupom").length).toBeGreaterThan(0);
  });

  it("avisa que o benefício ficaria sem texto quando o dado dinâmico não existe", async () => {
    const tokenItems = items.map((item) =>
      item.id === "one"
        ? {
            ...item,
            subtitle: "",
            subtitleContent: [{ type: "token" as const, token: "promocao.nome" }],
          }
        : item,
    );

    const user = userEvent.setup();
    render(
      <HomeFeaturesSection
        richTextContext={EMPTY_RICH_TEXT_CONTEXT}
        isSaving={false}
        issues={[]}
        items={tokenItems}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onUploadIcon={vi.fn()}
        uploadingId={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /expandir benefício 1/i }));
    expect(screen.getAllByText(/esta mensagem ficaria oculta no site/i).length).toBeGreaterThan(0);
  });

  it("mantém o editor do benefício fechado até a expansão", async () => {
    const user = userEvent.setup();

    render(
      <HomeFeaturesSection
        richTextContext={EMPTY_RICH_TEXT_CONTEXT}
        isSaving={false}
        issues={[]}
        items={items}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onUploadIcon={vi.fn()}
        uploadingId={null}
      />,
    );

    const toggle = screen.getByRole("button", { name: /expandir benefício 1/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("region", { name: /editor do benefício 1/i })).toHaveAttribute("inert");

    await user.click(toggle);
    expect(screen.getByRole("button", { name: /recolher benefício 1/i })).toHaveAttribute("aria-expanded", "true");
  });
});
