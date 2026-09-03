import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductsPagination } from "./products-pagination";

function renderPagination(overrides: Partial<Parameters<typeof ProductsPagination>[0]> = {}) {
  const onChangePage = vi.fn();
  const onChangePerPage = vi.fn();

  render(
    <ProductsPagination
      isLoading={false}
      onChangePage={onChangePage}
      onChangePerPage={onChangePerPage}
      page={1}
      perPage={20}
      totalPages={3}
      totalProducts={49}
      {...overrides}
    />,
  );

  return { onChangePage, onChangePerPage };
}

function visibleNumbers() {
  return screen
    .getAllByRole("button")
    .map((button) => button.getAttribute("aria-label") ?? "")
    .filter((label) => label.startsWith("Página ") && !label.includes("anterior"))
    .map((label) => label.replace("Página ", ""));
}

describe("ProductsPagination", () => {
  it("mostra o intervalo de itens da página atual", () => {
    renderPagination({ page: 2, perPage: 20, totalPages: 3, totalProducts: 49 });

    expect(screen.getByText(/21–40 de 49 · página 2 de 3/)).toBeInTheDocument();
  });

  it("não estoura o total na última página", () => {
    renderPagination({ page: 3, perPage: 20, totalPages: 3, totalProducts: 49 });

    expect(screen.getByText(/41–49 de 49/)).toBeInTheDocument();
  });

  it("marca a página atual e desabilita o próprio botão", () => {
    renderPagination({ page: 2 });

    const current = screen.getByRole("button", { name: "Página 2" });

    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toBeDisabled();
    expect(screen.getByRole("button", { name: "Página 1" })).toBeEnabled();
  });

  it("navega direto para uma página específica", async () => {
    const user = userEvent.setup();
    const { onChangePage } = renderPagination({ page: 1 });

    await user.click(screen.getByRole("button", { name: "Página 3" }));

    expect(onChangePage).toHaveBeenCalledWith(3);
  });

  it("anda com anterior e próxima", async () => {
    const user = userEvent.setup();
    const { onChangePage } = renderPagination({ page: 2 });

    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await user.click(screen.getByRole("button", { name: "Página anterior" }));

    expect(onChangePage).toHaveBeenNthCalledWith(1, 3);
    expect(onChangePage).toHaveBeenNthCalledWith(2, 1);
  });

  it("desabilita anterior na primeira e próxima na última", () => {
    const { onChangePage } = renderPagination({ page: 1 });

    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeEnabled();
    expect(onChangePage).not.toHaveBeenCalled();
  });

  it("encolhe com reticências quando há muitas páginas", () => {
    renderPagination({ page: 9, totalPages: 18 });

    expect(visibleNumbers()).toEqual(["1", "8", "9", "10", "18"]);
    expect(screen.getAllByText("…")).toHaveLength(2);
  });

  it("mantém primeira e última alcançáveis no meio da lista", async () => {
    const user = userEvent.setup();
    const { onChangePage } = renderPagination({ page: 9, totalPages: 18 });

    await user.click(screen.getByRole("button", { name: "Página 18" }));
    await user.click(screen.getByRole("button", { name: "Página 1" }));

    expect(onChangePage).toHaveBeenNthCalledWith(1, 18);
    expect(onChangePage).toHaveBeenNthCalledWith(2, 1);
  });

  it("troca de itens por página e destaca a opção vigente", async () => {
    const user = userEvent.setup();
    const { onChangePerPage } = renderPagination({ perPage: 20 });

    expect(screen.getByRole("button", { name: /Mostrar 20 produtos/ })).toHaveAttribute(
      "aria-current",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /Mostrar 50 produtos/ }));

    expect(onChangePerPage).toHaveBeenCalledWith(50);
  });

  it("oferece a troca de itens por página mesmo com uma página só", () => {
    renderPagination({ totalPages: 1 });

    expect(screen.getByRole("button", { name: /Mostrar 10 produtos/ })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Próxima página" })).not.toBeInTheDocument();
  });

  it("congela os controles enquanto carrega", () => {
    renderPagination({ isLoading: true, page: 2 });

    expect(screen.getByRole("button", { name: "Página 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Mostrar 50 produtos/ })).toBeDisabled();
  });
});
