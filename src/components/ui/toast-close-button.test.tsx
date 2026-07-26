import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ToastCloseButton } from "./toast-close-button";

describe("ToastCloseButton", () => {
  it("calls onClose when clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ToastCloseButton onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /fechar notifica/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is reachable and activatable by keyboard", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ToastCloseButton onClose={onClose} />);

    await user.tab();
    expect(screen.getByRole("button", { name: /fechar notifica/i })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
