import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ModalSection, PromotionToggle } from "./form-fields";
import { hasValidProductPrice } from "../helpers";

const HELP_TEXT = "A classificação da Papelito. O WooCommerce passa a ser sincronizado a partir daqui.";

function renderInsideClippingContainer() {
  return render(
    <div className="overflow-hidden" data-testid="clipping-container">
      <div className="overflow-y-auto" data-testid="scroll-container">
        <ModalSection helpText={HELP_TEXT} title="Classificação">
          <p>conteúdo</p>
        </ModalSection>
      </div>
    </div>,
  );
}

describe("InfoTooltip", () => {
  it("only renders the tooltip while the trigger is hovered", async () => {
    const user = userEvent.setup();
    renderInsideClippingContainer();

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.hover(screen.getByRole("button", { name: "Mais informações" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(HELP_TEXT);

    await user.unhover(screen.getByRole("button", { name: "Mais informações" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("escapes the clipping ancestors by rendering the tooltip in a body portal", async () => {
    const user = userEvent.setup();
    const { getByTestId } = renderInsideClippingContainer();

    await user.hover(screen.getByRole("button", { name: "Mais informações" }));

    const tooltip = screen.getByRole("tooltip");

    expect(getByTestId("clipping-container")).not.toContainElement(tooltip);
    expect(getByTestId("scroll-container")).not.toContainElement(tooltip);
    expect(tooltip.parentElement).toBe(document.body);
    expect(tooltip.className).toContain("fixed");
    expect(tooltip.style.transform).toMatch(/^translate3d\(/);
  });

  it("describes the trigger with the tooltip while it is open", async () => {
    const user = userEvent.setup();
    renderInsideClippingContainer();

    const trigger = screen.getByRole("button", { name: "Mais informações" });
    expect(trigger).not.toHaveAttribute("aria-describedby");

    await user.hover(trigger);
    expect(trigger.getAttribute("aria-describedby")).toBe(screen.getByRole("tooltip").id);
  });

  it("shows the tooltip on keyboard focus and hides it on blur", async () => {
    const user = userEvent.setup();
    renderInsideClippingContainer();

    await user.tab();
    expect(screen.getByRole("button", { name: "Mais informações" })).toHaveFocus();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.tab();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});

describe("PromotionToggle", () => {
  const label = "Agendar promoção (Sim/Não)";

  function renderToggle(salePrice: string, isEnabled = false) {
    const onChange = vi.fn();
    render(
      <PromotionToggle
        isDisabled={!hasValidProductPrice(salePrice)}
        isEnabled={isEnabled}
        onChange={onChange}
      />,
    );

    return { onChange, toggle: screen.getByLabelText(label) };
  }

  it("fica desabilitado sem preço promocional", async () => {
    const user = userEvent.setup();
    const { onChange, toggle } = renderToggle("");

    expect(toggle).toBeDisabled();

    await user.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("fica desabilitado com preço promocional zerado", () => {
    expect(renderToggle("0").toggle).toBeDisabled();
  });

  it("fica desabilitado com preço promocional inválido", () => {
    expect(renderToggle("de graça").toggle).toBeDisabled();
  });

  it("libera o agendamento com preço promocional maior que zero", async () => {
    const user = userEvent.setup();
    const { onChange, toggle } = renderToggle("12,50");

    expect(toggle).toBeEnabled();

    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("explica por que o agendamento está bloqueado", () => {
    renderToggle("");

    expect(
      screen.getByText("Informe um preço promocional maior que zero para agendar a promoção."),
    ).toBeInTheDocument();
  });
});
