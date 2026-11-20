import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { boxLabel, packingHeadline, VendorOrderPacking } from "./vendor-order-packing";

const FULL_BOX = { lengthCm: 20, widthCm: 15, heightCm: 100, weightKg: 2 };
const LAST_BOX = { lengthCm: 20, widthCm: 15, heightCm: 5, weightKg: 0.1 };

describe("VendorOrderPacking", () => {
  it("conta as caixas no singular e no plural", () => {
    expect(packingHeadline([FULL_BOX])).toBe("1 caixa");
    expect(packingHeadline([FULL_BOX, LAST_BOX])).toBe("2 caixas");
  });

  it("formata medidas em cm e peso em kg", () => {
    expect(boxLabel(LAST_BOX)).toBe("20 × 15 × 5 cm · 0,1 kg");
  });

  it("lista cada caixa numerada", () => {
    render(<VendorOrderPacking boxes={[FULL_BOX, FULL_BOX, LAST_BOX]} />);
    expect(screen.getByText("3 caixas")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Caixa 3: 20 × 15 × 5 cm · 0,1 kg")).toBeInTheDocument();
  });
});
