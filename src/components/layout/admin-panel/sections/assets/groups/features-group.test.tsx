import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_RICH_TEXT_CONTEXT } from "@/features/rich-text";
import type { HomeFeatureItem } from "@/types/home-assets";

import { FeaturesGroup } from "./features-group";

const items: HomeFeatureItem[] = [
  {
    iconId: 0,
    iconUrl: "/images/icons/truck.svg",
    id: "one",
    subtitle: "Com cupom",
    subtitleContent: null,
    title: "Frete Grátis",
  },
  {
    iconId: 0,
    iconUrl: "/images/icons/refresh.svg",
    id: "two",
    subtitle: "15 dias para troca",
    subtitleContent: null,
    title: "Troca Fácil",
  },
  {
    iconId: 0,
    iconUrl: "/images/icons/price.svg",
    id: "three",
    subtitle: "Em 3x sem juros",
    subtitleContent: null,
    title: "Parcelamos",
  },
  {
    iconId: 0,
    iconUrl: "/images/icons/thunder.svg",
    id: "four",
    subtitle: "Sai no mesmo dia",
    subtitleContent: null,
    title: "Envio Rápido",
  },
];

const stale = items.map((item) => (item.id === "one" ? { ...item, title: "Antigo" } : item));

function renderGroup(props: Partial<Parameters<typeof FeaturesGroup>[0]> = {}) {
  return render(
    <FeaturesGroup
      isSaving={false}
      issues={[]}
      items={items}
      notice={null}
      onChange={vi.fn()}
      onSave={vi.fn(async () => true)}
      onUploadIcon={vi.fn()}
      persistedItems={stale}
      richTextContext={EMPTY_RICH_TEXT_CONTEXT}
      uploadingId={null}
      {...props}
    />,
  );
}

describe("FeaturesGroup", () => {
  it("abre o editor do benefício e expõe o upload de SVG", async () => {
    const user = userEvent.setup();
    renderGroup();

    expect(screen.getByText(/benefícios da home · 4 itens/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /editar frete grátis/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Enviar ícone do benefício 1")).toHaveAttribute(
      "accept",
      "image/svg+xml,.svg",
    );
  });

  it("edita o título pelo modal", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderGroup({ onChange });

    await user.click(screen.getByRole("button", { name: /editar frete grátis/i }));
    await user.type(screen.getByLabelText(/^título/i), "!");

    expect(onChange).toHaveBeenCalledWith("one", { title: "Frete Grátis!" });
  });

  it("avisa e bloqueia o salvamento quando um benefício está incompleto", () => {
    const invalid = items.map((item) => (item.id === "one" ? { ...item, title: "" } : item));
    renderGroup({ items: invalid });

    expect(screen.getByRole("alert")).toHaveTextContent(/preencha título/i);
    expect(screen.getByRole("button", { name: /salvar benefícios/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /editar benefício 1 sem título/i }),
    ).toBeInTheDocument();
  });

  it("libera o salvamento quando há alteração pendente", () => {
    renderGroup();

    expect(screen.getByRole("button", { name: /salvar benefícios/i })).toBeEnabled();
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
    renderGroup({
      items: tokenItems,
      richTextContext: { ...EMPTY_RICH_TEXT_CONTEXT, freeShippingMinimumCents: 12550 },
    });

    expect(screen.getAllByText("A partir de R$ 125,50 com cupom").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /editar frete grátis/i }));
    expect(screen.getAllByText("Frete grátis cupom").length).toBeGreaterThan(0);
  });
});
