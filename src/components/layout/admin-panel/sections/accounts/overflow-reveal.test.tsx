import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OverflowReveal } from "./overflow-reveal";

const LONG_NAME = "59.686.734 VITOR AUGUSTO BARBOSA DE ASSIS";
const DETAIL_HREF = "/admin/contas/42";

function stubWidths(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(clientWidth);
}

describe("OverflowReveal", () => {
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

  it("texto que cabe continua texto simples, sem link nem camada", () => {
    stubWidths(120, 200);
    render(<OverflowReveal href={DETAIL_HREF} text="Papelito" />);
    expect(screen.getByText("Papelito")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("texto cortado vira link focável com a camada completa fora da árvore de acessibilidade", () => {
    stubWidths(480, 200);
    const { container } = render(<OverflowReveal href={DETAIL_HREF} text={LONG_NAME} />);
    const link = screen.getByRole("link", { name: LONG_NAME });
    expect(link).toHaveAttribute("href", DETAIL_HREF);
    const layer = container.querySelector("[aria-hidden='true']");
    expect(layer).toHaveTextContent(LONG_NAME);
    expect(layer?.className).toContain("pointer-events-none");
    expect(layer?.className).toContain("absolute");
  });

  it("vínculo próprio continua link mesmo quando cabe", () => {
    stubWidths(120, 200);
    render(<OverflowReveal href="/admin/contas/empresa/7" interactive="always" text="Papelzão" />);
    expect(screen.getByRole("link", { name: "Papelzão" })).toHaveAttribute("href", "/admin/contas/empresa/7");
  });
});
