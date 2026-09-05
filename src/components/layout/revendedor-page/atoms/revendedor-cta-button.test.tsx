import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RevendedorCtaButton } from "./revendedor-cta-button";

describe("RevendedorCtaButton", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("scrolls to the triage form on every repeated click", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();

    window.history.replaceState(null, "", "/revendedor#revendedor-form");
    const form = document.createElement("div");
    form.id = "revendedor-form";
    form.scrollIntoView = scrollIntoView;
    document.body.append(form);

    render(<RevendedorCtaButton href="#revendedor-form">Quero começar a vender</RevendedorCtaButton>);

    const link = screen.getByRole("link", { name: /quero começar a vender/i });
    await user.click(link);
    await user.click(link);

    expect(link).toHaveAttribute("href", "/revendedor#revendedor-form");
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  });

  it("sends a revendedor route CTA to the triage form", () => {
    render(<RevendedorCtaButton href="/revendedor">Seja parceiro</RevendedorCtaButton>);

    expect(screen.getByRole("link", { name: /seja parceiro/i })).toHaveAttribute(
      "href",
      "/revendedor#revendedor-form",
    );
  });
});
