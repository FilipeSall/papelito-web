import { render } from "@testing-library/react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicHeaderNavLink } from "./nav-link";

let currentPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

describe("PublicHeaderNavLink", () => {
  beforeEach(() => {
    currentPathname = "/";
  });

  it("marca o link da rota atual como ativo", () => {
    const { container } = render(<PublicHeaderNavLink href="/" label="Home" />);

    expect(container.querySelector("a")).toHaveAttribute("data-active", "true");
  });

  it("não marca links de outras rotas como ativos", () => {
    currentPathname = "/produtos";
    const { container } = render(<PublicHeaderNavLink href="/" label="Home" />);

    expect(container.querySelector("a")).toHaveAttribute("data-active", "false");
  });

  it("não grava o estado ativo no HTML prerenderizado", () => {
    const html = renderToString(<PublicHeaderNavLink href="/" label="Home" />);

    expect(html).toContain('data-active="false"');
  });

  it("ativa o link após hidratar HTML prerenderizado com outro pathname", async () => {
    currentPathname = "/index";
    const html = renderToString(<PublicHeaderNavLink href="/" label="Home" />);

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    currentPathname = "/";
    await act(async () => {
      hydrateRoot(container, <PublicHeaderNavLink href="/" label="Home" />);
    });

    expect(container.querySelector("a")).toHaveAttribute("data-active", "true");
  });
});
