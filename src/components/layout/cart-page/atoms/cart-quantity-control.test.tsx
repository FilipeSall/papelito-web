import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CartQuantityControl } from "./cart-quantity-control";

describe("CartQuantityControl", () => {
  it("renders the quantity and enabled buttons by default", () => {
    render(
      <CartQuantityControl
        quantity={3}
        onDecrease={vi.fn()}
        onIncrease={vi.fn()}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Diminuir quantidade" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Aumentar quantidade" }),
    ).toBeEnabled();
    expect(screen.queryByText("Verificando estoque")).not.toBeInTheDocument();
  });

  it("replaces the quantity with an accessible spinner and disables both buttons when loading", () => {
    render(
      <CartQuantityControl
        quantity={3}
        loading
        onDecrease={vi.fn()}
        onIncrease={vi.fn()}
      />,
    );

    expect(screen.queryByText("3")).not.toBeInTheDocument();
    expect(screen.getByText("Verificando estoque")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Diminuir quantidade" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Aumentar quantidade" }),
    ).toBeDisabled();
  });

  it("marks the control as busy only while loading", () => {
    const { rerender, container } = render(
      <CartQuantityControl
        quantity={3}
        onDecrease={vi.fn()}
        onIncrease={vi.fn()}
      />,
    );

    expect(container.querySelector("[aria-busy='true']")).toBeNull();

    rerender(
      <CartQuantityControl
        quantity={3}
        loading
        onDecrease={vi.fn()}
        onIncrease={vi.fn()}
      />,
    );

    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
  });

  it("shows a stock tooltip on the increase button when a reason is provided", () => {
    render(
      <CartQuantityControl
        quantity={3}
        increaseDisabled
        increaseDisabledReason="Não há mais unidades disponíveis"
        onDecrease={vi.fn()}
        onIncrease={vi.fn()}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Não há mais unidades disponíveis");

    const increaseButton = screen.getByRole("button", {
      name: "Aumentar quantidade",
    });
    expect(increaseButton).toHaveAttribute(
      "aria-describedby",
      tooltip.getAttribute("id"),
    );
    expect(increaseButton).toHaveAttribute("aria-disabled", "true");
  });

  it("does not click increase when it is blocked by a stock reason", async () => {
    const onIncrease = vi.fn();
    const user = userEvent.setup();
    render(
      <CartQuantityControl
        quantity={3}
        increaseDisabled
        increaseDisabledReason="Não há mais unidades disponíveis"
        onDecrease={vi.fn()}
        onIncrease={onIncrease}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    expect(onIncrease).not.toHaveBeenCalled();
  });

  it("does not render a tooltip while loading", () => {
    render(
      <CartQuantityControl
        quantity={3}
        loading
        increaseDisabledReason="Não há mais unidades disponíveis"
        onDecrease={vi.fn()}
        onIncrease={vi.fn()}
      />,
    );

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not render a tooltip when there is no reason", () => {
    render(
      <CartQuantityControl
        quantity={3}
        onDecrease={vi.fn()}
        onIncrease={vi.fn()}
      />,
    );

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not disable the decrease button when only the increase is disabled", async () => {
    const onDecrease = vi.fn();
    const user = userEvent.setup();
    render(
      <CartQuantityControl
        quantity={3}
        increaseDisabled
        onDecrease={onDecrease}
        onIncrease={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Aumentar quantidade" }),
    ).toBeDisabled();
    const decreaseButton = screen.getByRole("button", {
      name: "Diminuir quantidade",
    });
    expect(decreaseButton).toBeEnabled();

    await user.click(decreaseButton);
    expect(onDecrease).toHaveBeenCalledTimes(1);
  });
});
