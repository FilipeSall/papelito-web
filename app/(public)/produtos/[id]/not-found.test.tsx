import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProductNotFound from "./not-found";

describe("ProductNotFound", () => {
  it("não revela rotas ou conceitos internos do vendor", () => {
    render(<ProductNotFound />);

    expect(screen.getByRole("link", { name: "Ver catálogo" })).toHaveAttribute(
      "href",
      "/produtos",
    );
    expect(screen.queryByRole("link", { name: /estoque/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/vendor|variação interna/i)).not.toBeInTheDocument();
  });
});
