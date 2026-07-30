import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FEATURES_BAR_ITEMS } from "./constants";
import { FeaturesBar } from "./features-bar";

describe("FeaturesBar", () => {
  it("keeps four responsive benefit items and renders persisted values", () => {
    const items = FEATURES_BAR_ITEMS.map((item, index) => ({
      ...item,
      title: index === 0 ? "Frete Especial" : item.title,
      subtitle: index === 0 ? "Acima de R$700" : item.subtitle,
    }));

    render(<FeaturesBar items={items} />);

    expect(screen.getAllByText(/Frete Especial|Troca Fácil|Parcelamos|Envio Rápido/)).toHaveLength(12);
    expect(screen.getAllByText("Frete Especial")).toHaveLength(3);
    expect(screen.getAllByText("Acima de R$700")).toHaveLength(3);
  });
});
