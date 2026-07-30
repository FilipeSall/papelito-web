import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CollapsiblePanel } from "./collapsible-panel";

function renderPanel(overrides?: { defaultOpen?: boolean; onSave?: () => void }) {
  return render(
    <CollapsiblePanel
      actions={
        <button onClick={overrides?.onSave} type="button">
          Salvar seção
        </button>
      }
      defaultOpen={overrides?.defaultOpen}
      description="Descrição resumida da seção."
      eyebrow="home"
      hint="Formato ideal: 16:5."
      title="Imagem do PDV Perfeito"
    >
      <input aria-label="Texto alternativo" type="text" />
    </CollapsiblePanel>,
  );
}

function getToggle() {
  return screen.getByRole("button", { name: /expandir|recolher/i });
}

describe("CollapsiblePanel", () => {
  it("starts collapsed and keeps the header visible", () => {
    renderPanel();

    expect(getToggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("heading", { name: "Imagem do PDV Perfeito" })).toBeInTheDocument();
    expect(screen.getByText("Descrição resumida da seção.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar seção" })).toBeInTheDocument();
  });

  it("can start expanded when defaultOpen is set", () => {
    renderPanel({ defaultOpen: true });

    expect(getToggle()).toHaveAttribute("aria-expanded", "true");
    expect(getToggle()).toHaveAccessibleName(/recolher imagem do pdv perfeito/i);
  });

  it("toggles aria-expanded on click and exposes the controlled region", async () => {
    const user = userEvent.setup();
    renderPanel();

    const toggle = getToggle();
    const regionId = toggle.getAttribute("aria-controls");

    expect(regionId).toBeTruthy();

    const region = document.getElementById(regionId as string);
    expect(region).not.toBeNull();
    expect(region).toHaveAttribute("role", "region");
    expect(region).toHaveAttribute("inert");

    await user.click(toggle);

    expect(getToggle()).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(regionId as string)).not.toHaveAttribute("inert");

    await user.click(getToggle());

    expect(getToggle()).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(regionId as string)).toHaveAttribute("inert");
  });

  it("labels the region with the section title", () => {
    renderPanel({ defaultOpen: true });

    const toggle = getToggle();
    const region = document.getElementById(toggle.getAttribute("aria-controls") as string);
    const heading = screen.getByRole("heading", { name: "Imagem do PDV Perfeito" });

    expect(region).toHaveAttribute("aria-labelledby", heading.id);
  });

  it("opens with the keyboard", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.tab();
    await user.tab();
    expect(getToggle()).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(getToggle()).toHaveAttribute("aria-expanded", "true");

    await user.keyboard(" ");
    expect(getToggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("does not change the expansion state when the save action is used", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderPanel({ defaultOpen: true, onSave });

    await user.click(screen.getByRole("button", { name: "Salvar seção" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(getToggle()).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps the expansion state of each instance independent", async () => {
    const user = userEvent.setup();
    render(
      <>
        <CollapsiblePanel description="Primeira" eyebrow="home" title="Seção A">
          <p>Conteúdo A</p>
        </CollapsiblePanel>
        <CollapsiblePanel description="Segunda" eyebrow="home" title="Seção B">
          <p>Conteúdo B</p>
        </CollapsiblePanel>
      </>,
    );

    const toggleA = screen.getByRole("button", { name: /expandir seção a/i });
    const toggleB = screen.getByRole("button", { name: /expandir seção b/i });

    await user.click(toggleA);

    expect(screen.getByRole("button", { name: /recolher seção a/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(toggleB).toHaveAttribute("aria-expanded", "false");
  });
});
