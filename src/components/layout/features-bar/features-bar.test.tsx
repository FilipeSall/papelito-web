import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FEATURES_BAR_ITEMS } from "./constants";
import { FeaturesBar } from "./features-bar";

describe("FeaturesBar", () => {
  it("renders each benefit once, with the persisted title and subtitle", () => {
    const items = FEATURES_BAR_ITEMS.map((item, index) => ({
      ...item,
      title: index === 0 ? "Frete Especial" : item.title,
      subtitle: index === 0 ? "Acima de R$700" : item.subtitle,
    }));

    render(<FeaturesBar items={items} />);

    // Uma célula por benefício: a régua adapta por CSS, não repetindo o item no DOM.
    expect(
      screen.getAllByText(/Frete Especial|Troca Fácil|Parcelamos|Envio Rápido/),
    ).toHaveLength(4);
    expect(screen.getAllByText("Frete Especial")).toHaveLength(1);
    expect(screen.getAllByText("Acima de R$700")).toHaveLength(1);
  });

  it("renders nothing when there is no persisted benefit", () => {
    const { container } = render(<FeaturesBar items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
