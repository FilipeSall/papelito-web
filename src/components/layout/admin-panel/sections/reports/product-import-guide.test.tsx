import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ProductImportGuide } from "./product-import-guide";

describe("ProductImportGuide", () => {
  it("mostra o exemplo aceito, as colunas e as palavras reconhecidas", async () => {
    const user = userEvent.setup();
    render(<ProductImportGuide />);
    await user.click(screen.getByRole("button", { name: "Ver exemplo e colunas" }));

    const dialog = screen.getByRole("dialog", { name: "Como montar a planilha" });
    expect(within(dialog).getByRole("columnheader", { name: "preco_regular" })).toBeInTheDocument();
    expect(within(dialog).getByText("Dichavador Exemplo Metal 4 Partes")).toBeInTheDocument();
    expect(within(dialog).getByText("triturador, grinder, dichavador")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Baixar este exemplo" })).toBeInTheDocument();
  });
});
