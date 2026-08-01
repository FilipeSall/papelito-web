import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductSearch } from "./product-search";

const replace = vi.fn();
let searchParams = new URLSearchParams("tipo=sedas&page=3");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

describe("ProductSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockReset();
    searchParams = new URLSearchParams("tipo=sedas&page=3");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("aplica a busca com debounce, preserva filtros e reinicia a paginação", () => {
    render(<ProductSearch initialValue="" totalItems={0} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Seda trad" } });
    expect(replace).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(replace).toHaveBeenCalledWith("/produtos?tipo=sedas&busca=Seda+trad", {
      scroll: false,
    });
  });

  it("limpa a busca imediatamente e mantém os filtros ativos", () => {
    render(<ProductSearch initialValue="seda" totalItems={2} />);

    fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }));

    expect(replace).toHaveBeenCalledWith("/produtos?tipo=sedas", { scroll: false });
  });

  it("restaura o catálogo imediatamente quando o texto é apagado", () => {
    render(<ProductSearch initialValue="seda" totalItems={2} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });

    expect(replace).toHaveBeenCalledWith("/produtos?tipo=sedas", { scroll: false });
  });

  it("expõe label e resultado para tecnologias assistivas", () => {
    render(<ProductSearch initialValue="seda" totalItems={1} />);

    const input = screen.getByRole("textbox", {
      name: "Buscar produtos por nome ou característica",
    });

    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("status")).toHaveTextContent("1 produto encontrado.");
  });
});
