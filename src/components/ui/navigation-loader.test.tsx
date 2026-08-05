import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NavigationLoader } from "./navigation-loader";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} />,
}));

let currentPathname = "/";
let currentSearch = "";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

function goTo(pathname: string, search = "") {
  currentPathname = pathname;
  currentSearch = search;
  window.history.replaceState(null, "", `${pathname}${search ? `?${search}` : ""}`);
}

function clickLink(href: string) {
  const anchor = document.createElement("a");
  anchor.setAttribute("href", href);
  document.body.appendChild(anchor);

  act(() => {
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
  });
}

describe("NavigationLoader", () => {
  beforeEach(() => {
    goTo("/");
  });

  it("não mantém um status acessível quando está inativo", () => {
    render(<NavigationLoader />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("exibe o overlay enquanto a navegação clicada não muda a URL", () => {
    render(<NavigationLoader />);

    clickLink("/entrar");

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("esconde o overlay quando a URL muda", () => {
    const { rerender } = render(<NavigationLoader />);

    clickLink("/entrar");
    goTo("/entrar");
    rerender(<NavigationLoader />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("não reabre o overlay ao voltar para a URL de origem de uma navegação já concluída", () => {
    const { rerender } = render(<NavigationLoader />);

    clickLink("/entrar");
    goTo("/entrar");
    rerender(<NavigationLoader />);

    goTo("/");
    rerender(<NavigationLoader />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
