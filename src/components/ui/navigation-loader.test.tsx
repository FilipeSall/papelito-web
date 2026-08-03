import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NavigationLoader } from "./navigation-loader";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("NavigationLoader", () => {
  it("não mantém um status acessível quando está inativo", () => {
    render(<NavigationLoader />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
