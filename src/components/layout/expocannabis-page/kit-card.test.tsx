import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EventKit } from "@/features/expocannabis/types/context";

import { KitCard } from "./kit-card";

const KIT_IDS = [101, 102, 103, 104];

function kit(pctOff: number, unitCents: number): EventKit {
  return { productIds: KIT_IDS, unitCents, fullUnitCents: 77170, available: true, pctOff };
}

describe("KitCard", () => {
  it.each([
    [20, 61736, "−20% liberado", "De R$ 771,70 por R$ 617,36"],
    [50, 38585, "−50% liberado", "De R$ 771,70 por R$ 385,85"],
  ])("anuncia o desconto publicado de %i%%", (pctOff, unitCents, badge, price) => {
    render(<KitCard kit={kit(pctOff, unitCents)} kits={0} onAdd={vi.fn()} units={12} />);

    expect(screen.getByText(badge)).toBeInTheDocument();
    expect(screen.getByText(price)).toBeInTheDocument();
    expect(screen.queryByText(/−15%/)).not.toBeInTheDocument();
  });

  it("não promete desconto quando o kit está a 0%", () => {
    render(<KitCard kit={kit(0, 77170)} kits={0} onAdd={vi.fn()} units={12} />);

    expect(screen.getByText("Kit liberado")).toBeInTheDocument();
    expect(screen.getByText("R$ 771,70")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("usa o desconto publicado no aviso de bloqueio", () => {
    render(<KitCard kit={kit(20, 61736)} kits={0} onAdd={vi.fn()} units={7} />);

    expect(screen.getByText("Faltam 3 unidades no pedido pra liberar o −20%")).toBeInTheDocument();
  });

  it("fala do kit, sem porcentagem, no bloqueio a 0%", () => {
    render(<KitCard kit={kit(0, 77170)} kits={0} onAdd={vi.fn()} units={9} />);

    expect(screen.getByText("Kit ainda bloqueado")).toBeInTheDocument();
    expect(screen.getByText("Falta 1 unidade no pedido pra liberar o kit")).toBeInTheDocument();
  });
});
