import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StockSku } from "./stock-sku";

const SHORT_SKU = "1992-pl";
const LONG_SKU = "ERP-DISTRIBUIDORA-CENTRO-OESTE-000419-SEDA-KING-SIZE";

function stubWidths(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(clientWidth);
}

describe("StockSku", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class {
      observe() { return undefined; }
      disconnect() { return undefined; }
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("SKU que cabe fica numa linha, sem camada, com o botão de copiar no hover", () => {
    stubWidths(60, 200);
    const { container } = render(<StockSku value={SHORT_SKU} />);
    expect(screen.getByText(SHORT_SKU)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Copiar SKU ${SHORT_SKU}` }).className).toContain("group-hover/sku:opacity-100");
    expect(container.querySelector(".absolute")).toBeNull();
  });

  it("SKU cortado ganha a camada expandida com o valor inteiro e o botão de copiar dentro dela", () => {
    stubWidths(480, 120);
    const { container } = render(<StockSku value={LONG_SKU} />);
    const layer = container.querySelector(".absolute");
    expect(layer).toHaveTextContent(LONG_SKU);
    expect(layer?.className).toContain("group-hover/sku:[clip-path:inset(0)]");
    expect(layer?.className).toContain("group-focus-within/sku:opacity-100");
    expect(screen.getAllByRole("button", { name: `Copiar SKU ${LONG_SKU}` })).toHaveLength(1);
  });

  it("copiar grava o SKU na área de transferência e anuncia", async () => {
    stubWidths(60, 200);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<StockSku value={SHORT_SKU} />);
    fireEvent.click(screen.getByRole("button", { name: `Copiar SKU ${SHORT_SKU}` }));
    await waitFor(() => expect(screen.getByText("SKU copiado")).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(SHORT_SKU);
  });

  it("falha ao copiar avisa sem quebrar a linha", async () => {
    stubWidths(60, 200);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("negado")) } });
    render(<StockSku value={SHORT_SKU} />);
    fireEvent.click(screen.getByRole("button", { name: `Copiar SKU ${SHORT_SKU}` }));
    await waitFor(() => expect(screen.getByText("Não foi possível copiar o SKU")).toBeInTheDocument());
  });
});
