import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const taxonomyClient = vi.hoisted(() => ({
  getPapelitoTaxonomy: vi.fn(),
}));

vi.mock("@/features/catalog/services/get-papelito-categories", () => taxonomyClient);

import { PublicFooter } from "./public-footer";

describe("PublicFooter", () => {
  beforeEach(() => {
    taxonomyClient.getPapelitoTaxonomy.mockResolvedValue({
      available: true,
      categories: [
        { name: "Sedas", slug: "sedas" },
        { name: "Bituqueiras", slug: "bituqueiras" },
      ],
      version: 1,
    });
  });

  it("lista as categorias fornecidas pela taxonomia Papelito", async () => {
    render(await PublicFooter({}));

    expect(screen.getByRole("link", { name: "Sedas" })).toHaveAttribute(
      "href",
      "/produtos?tipo=sedas",
    );
    expect(screen.getByRole("link", { name: "Bituqueiras" })).toHaveAttribute(
      "href",
      "/produtos?tipo=bituqueiras",
    );
  });
});
