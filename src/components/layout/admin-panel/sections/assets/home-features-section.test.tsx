import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { HomeFeatureItem } from "@/types/home-assets";

import { HomeFeaturesSection } from "./home-features-section";

const items: HomeFeatureItem[] = [
  { id: "one", title: "Frete Grátis", subtitle: "Acima de R$500", iconId: 0, iconUrl: "/images/icons/truck.svg" },
  { id: "two", title: "Troca Fácil", subtitle: "15 dias para troca", iconId: 0, iconUrl: "/images/icons/refresh.svg" },
  { id: "three", title: "Parcelamos", subtitle: "Em 3x sem juros", iconId: 0, iconUrl: "/images/icons/price.svg" },
  { id: "four", title: "Envio Rápido", subtitle: "Sai no mesmo dia", iconId: 0, iconUrl: "/images/icons/thunder.svg" },
];

describe("HomeFeaturesSection", () => {
  it("edits text, validates empty values and exposes SVG upload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const view = render(
      <HomeFeaturesSection
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
    expect(screen.getByLabelText("Enviar ícone do benefício 1")).toHaveAttribute("accept", "image/svg+xml,.svg");

    await user.clear(document.getElementById("home-feature-title-one") as HTMLInputElement);
    view.rerender(
      <HomeFeaturesSection
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
});
