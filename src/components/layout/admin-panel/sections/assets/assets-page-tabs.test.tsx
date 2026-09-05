import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { AssetsPageKey } from "./assets-config";
import { AssetsPageTabs, type AssetsPageSummary } from "./assets-page-tabs";

const summaries: Record<AssetsPageKey, AssetsPageSummary> = {
  global: { attention: 0, total: 3 },
  home: { attention: 2, total: 9 },
  produtos: { attention: 0, total: 1 },
  revendedor: { attention: 1, total: 4 },
  sobre: { attention: 0, total: 2 },
};

function Harness({ initialPage = "global" as AssetsPageKey }) {
  const [activePage, setActivePage] = useState<AssetsPageKey>(initialPage);

  return (
    <AssetsPageTabs activePage={activePage} onSelect={setActivePage} summaries={summaries} />
  );
}

describe("AssetsPageTabs", () => {
  it("marca a página ativa e deixa só ela na ordem de tabulação", () => {
    render(<Harness />);

    expect(screen.getByRole("tab", { name: /global/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /global/i })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: /home/i })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: /home/i })).toHaveAttribute("tabindex", "-1");
  });

  it("troca de página no clique", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("tab", { name: /sobre/i }));

    expect(screen.getByRole("tab", { name: /sobre/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /global/i })).toHaveAttribute("aria-selected", "false");
  });

  it("navega pelas setas e pelas teclas Home e End", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    screen.getByRole("tab", { name: /global/i }).focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /home/i })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: /global/i })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /revendedor/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: /global/i })).toHaveAttribute("aria-selected", "true");
  });

  it("anuncia por texto quantos assets precisam de atenção", () => {
    render(<Harness />);

    expect(screen.getByRole("tab", { name: /home/i })).toHaveAccessibleName(
      /2 assets precisam de atenção/i,
    );
    expect(screen.getByRole("tab", { name: /revendedor/i })).toHaveAccessibleName(
      /1 asset precisa de atenção/i,
    );
    expect(screen.getByRole("tab", { name: /produtos/i })).toHaveAccessibleName(
      /^(?!.*atenção).*$/i,
    );
  });
});
