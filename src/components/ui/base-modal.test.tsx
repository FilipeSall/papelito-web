import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BaseModal } from "./base-modal";

describe("BaseModal", () => {
  it("renders through a portal and locks body scroll while open", async () => {
    const onClose = vi.fn();
    const { container, rerender } = render(
      <BaseModal
        ariaLabelledBy="test-modal-title"
        onClose={onClose}
        open
      >
        <div>
          <h2 id="test-modal-title">Modal aberto</h2>
        </div>
      </BaseModal>,
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <BaseModal
        ariaLabelledBy="test-modal-title"
        onClose={onClose}
        open={false}
      >
        <div>
          <h2 id="test-modal-title">Modal aberto</h2>
        </div>
      </BaseModal>,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and overlay click", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <BaseModal
        ariaLabelledBy="test-modal-title"
        onClose={onClose}
        open
      >
        <div>
          <h2 id="test-modal-title">Modal aberto</h2>
        </div>
      </BaseModal>,
    );

    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("base-modal-overlay"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
