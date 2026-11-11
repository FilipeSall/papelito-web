import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attendanceReducer, initialAttendance } from "@/features/expocannabis/hooks/attendance-reducer";
import { buildEventContext } from "@/features/expocannabis/test/fixtures";
import type { EventContext } from "@/features/expocannabis/types/context";

import { StoreScreen } from "./store-screen";

const BUYER = {
  cnpj: "11222333000181",
  legalName: "Loja LTDA",
  tradeName: "Loja",
  address: { cep: "01001000", street: "Praça da Sé", city: "São Paulo", state: "SP", number: "", neighborhood: "" },
  companyId: null,
};

const KIT_REMOVED = "O Kit Premium saiu: ele precisa de 10 unidades no pedido.";

function Harness({ context, onCheckout, stockIssues = [] }: Readonly<{ context: EventContext; onCheckout: () => void; stockIssues?: { productId: number; available: number }[] }>) {
  const [state, dispatch] = useReducer(attendanceReducer, { ...initialAttendance(), screen: 2, buyer: BUYER, qty: stockIssues.length ? { 200: 5 } : {}, stockIssues });
  return <StoreScreen context={context} state={state} dispatch={dispatch} onCheckout={onCheckout} />;
}

function renderStore(context = buildEventContext()) {
  const onCheckout = vi.fn();
  render(<Harness context={context} onCheckout={onCheckout} />);
  return { onCheckout };
}

async function openCategory(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("button", { name: label }));
}

describe("StoreScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("5/10/20 definem a quantidade", async () => {
    const user = userEvent.setup();
    renderStore();
    await openCategory(user, "Sedas");

    await user.click(screen.getByRole("button", { name: "Colocar 10 de Avulso no pedido" }));
    expect(screen.getByText("10 no pedido", { selector: "[data-qty='200']" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Colocar 10 de Avulso no pedido" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Colocar 5 de Avulso no pedido" }));
    expect(screen.getByText("5 no pedido", { selector: "[data-qty='200']" })).toBeInTheDocument();
  });

  it("estoque zero desabilita e o stepper para no estoque", async () => {
    const user = userEvent.setup();
    const context = buildEventContext();
    context.products[4] = { ...context.products[4], stock: 2 };
    renderStore(context);
    await openCategory(user, "Sedas");

    expect(screen.getByRole("button", { name: "Adicionar Sem estoque" })).toBeDisabled();
    expect(screen.getAllByText("Sem estoque").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Adicionar Avulso" }));
    await user.click(screen.getByRole("button", { name: "Colocar 1 de Avulso" }));
    expect(screen.getByRole("button", { name: "Colocar 1 de Avulso" })).toBeDisabled();
    expect(screen.getByText("2 no pedido", { selector: "[data-qty='200']" })).toBeInTheDocument();
  });

  it("level-toast aparece só na primeira subida de cada nível", async () => {
    const user = userEvent.setup();
    renderStore();
    await openCategory(user, "Sedas");

    await user.click(screen.getByRole("button", { name: "Colocar 10 de Avulso no pedido" }));
    expect(screen.getByText("Você virou Parceiro!")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    await user.click(screen.getByRole("button", { name: "Colocar 5 de Avulso no pedido" }));
    await user.click(screen.getByRole("button", { name: "Colocar 10 de Avulso no pedido" }));
    expect(screen.queryByText("Você virou Parceiro!")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Colocar 20 de Avulso no pedido" }));
    expect(screen.getByText("Você é PDV Perfeito!")).toBeInTheDocument();
  });

  it("kit fica bloqueado abaixo de 10 unidades", async () => {
    const user = userEvent.setup();
    renderStore();
    await openCategory(user, "Sedas");
    await user.click(screen.getByRole("button", { name: "Adicionar Avulso" }));
    await user.click(screen.getByRole("button", { name: /Ver pedido/ }));

    const kit = screen.getByRole("region", { name: "Kit de Sedas Premium" });
    expect(within(kit).getByText("Faltam 9 unidades no pedido pra liberar o −15%")).toBeInTheDocument();
    expect(within(kit).getByRole("button", { name: "Bloqueado" })).toBeDisabled();
  });

  it("kit sai sozinho abaixo de 10 e Desfazer restaura tudo", async () => {
    const user = userEvent.setup();
    renderStore();
    await openCategory(user, "Sedas");
    await user.click(screen.getByRole("button", { name: "Colocar 10 de Avulso no pedido" }));
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));
    await user.click(screen.getByRole("button", { name: /Ver pedido/ }));
    await user.click(screen.getByRole("button", { name: "Adicionar kit" }));

    await user.click(screen.getByRole("button", { name: "Tirar 1 de Avulso" }));
    await user.click(screen.getByRole("button", { name: "Tirar 1 de Avulso" }));
    await user.click(screen.getByRole("button", { name: "Tirar 1 de Avulso" }));
    await user.click(screen.getByRole("button", { name: "Tirar 1 de Avulso" }));
    await user.click(screen.getByRole("button", { name: "Tirar 1 de Avulso" }));

    expect(screen.getByText(KIT_REMOVED)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bloqueado" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(screen.getByRole("button", { name: "+1 kit" })).toBeInTheDocument();
  }, 15_000);

  it("lixeira tira a linha e o Desfazer dura 5 s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderStore();
    await openCategory(user, "Sedas");
    await user.click(screen.getByRole("button", { name: "Colocar 5 de Avulso no pedido" }));
    await user.click(screen.getByRole("button", { name: /Ver pedido/ }));

    await user.click(screen.getByRole("button", { name: "Remover Avulso do pedido" }));
    expect(screen.getByRole("status", { name: "Desfazer remoção" })).toHaveTextContent("Avulso saiu do pedido.");

    await user.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(screen.getByRole("button", { name: "Remover Avulso do pedido" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remover Avulso do pedido" }));
    act(() => vi.advanceTimersByTime(5100));
    expect(screen.queryByRole("button", { name: "Desfazer" })).not.toBeInTheDocument();
  });

  it("aceita no máximo 3 kits e Fechar pedido segue para os dados", async () => {
    const user = userEvent.setup();
    const { onCheckout } = renderStore();
    await openCategory(user, "Sedas");
    await user.click(screen.getByRole("button", { name: "Colocar 10 de Avulso no pedido" }));
    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));
    await user.click(screen.getByRole("button", { name: /Ver pedido/ }));

    await user.click(screen.getByRole("button", { name: "Adicionar kit" }));
    await user.click(screen.getByRole("button", { name: "+1 kit" }));
    await user.click(screen.getByRole("button", { name: "+1 kit" }));
    expect(screen.getByRole("button", { name: "Máximo de 3 kits" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Fechar pedido" }));
    expect(onCheckout).toHaveBeenCalled();
  });

  it("destaca o produto que ficou sem estoque na cotação", () => {
    render(<Harness context={buildEventContext()} onCheckout={vi.fn()} stockIssues={[{ productId: 200, available: 3 }]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Faltou estoque: Avulso (tem 3). Ajuste o pedido e feche de novo.");
  });

  it("busca ignora acento e caixa", async () => {
    const user = userEvent.setup();
    renderStore();

    await user.type(screen.getByRole("searchbox", { name: "Buscar produtos" }), "ALFAFÁ");
    expect(screen.getByRole("heading", { name: "Alfafa" })).toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: "Buscar produtos" }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar produtos" }), "xyz");
    expect(screen.getByText("Nada encontrado. Tenta outro nome?")).toBeInTheDocument();
  });
});
