import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PromoMarqueeItem } from "@/types/home-assets";

import { PromoMarquee } from "./promo-marquee";

const messages: PromoMarqueeItem[] = [
  { id: "one", text: "⚡ Oferta um", order: 1, isActive: true },
  { id: "two", text: "Inativa", order: 2, isActive: false },
  { id: "three", text: "Oferta três", order: 3, isActive: true },
  { id: "four", text: "Oferta quatro", order: 4, isActive: true },
];

describe("PromoMarquee", () => {
  it("renders only active messages and duplicates them for the animation", () => {
    const { container } = render(<PromoMarquee items={messages} />);

    expect(screen.queryByText("Inativa")).not.toBeInTheDocument();
    expect(screen.getAllByText("⚡ Oferta um")).toHaveLength(2);
    expect(screen.getAllByText("Oferta três")).toHaveLength(2);
    expect(screen.getAllByText("Oferta quatro")).toHaveLength(2);
    expect(container.querySelectorAll("span")).toHaveLength(6);
  });

  it("renders no reserved space when there are no active messages", () => {
    const { container } = render(
      <PromoMarquee items={[{ ...messages[0], isActive: false }, messages[1], messages[2]]} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
