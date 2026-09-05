import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VendorOrderStatusPanel } from "./vendor-order-status-panel";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("VendorOrderStatusPanel", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("offers only the transitions the backend reported", () => {
    render(
      <VendorOrderStatusPanel
        hasShipments={false}
        nextStatuses={["em_separacao", "cancelado"]}
        orderId={14088}
        status="aguardando_envio"
      />,
    );

    expect(screen.getByRole("button", { name: /marcar como separado/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancelar pedido/i })).toBeInTheDocument();
  });

  it("never offers shipped or delivered, even if the backend lists them", () => {
    render(
      <VendorOrderStatusPanel
        hasShipments={false}
        nextStatuses={["enviado", "entregue", "em_separacao"]}
        orderId={14088}
        status="aguardando_envio"
      />,
    );

    expect(screen.queryByRole("button", { name: /^enviado$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^entregue$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /marcar como separado/i })).toBeInTheDocument();
  });

  it("states the terminal situation instead of an empty action box", () => {
    render(
      <VendorOrderStatusPanel hasShipments nextStatuses={[]} orderId={14087} status="entregue" />,
    );

    expect(screen.getByText(/situação final/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /marcar como separado/i })).not.toBeInTheDocument();
  });

  it("reports success and refreshes after a valid transition", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <VendorOrderStatusPanel
        hasShipments={false}
        nextStatuses={["em_separacao"]}
        orderId={14088}
        status="aguardando_envio"
      />,
    );

    await user.click(screen.getByRole("button", { name: /marcar como separado/i }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/vendor/orders/14088/status", {
      body: JSON.stringify({ status: "em_separacao" }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    expect(screen.getByRole("status")).toHaveTextContent(/pedido atualizado/i);
  });

  it("guards against a repeated click while the request is in flight", async () => {
    const pending: Array<(value: Response) => void> = [];
    const fetchMock = vi
      .fn()
      .mockImplementation(() => new Promise<Response>((resolve) => pending.push(resolve)));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <VendorOrderStatusPanel
        hasShipments={false}
        nextStatuses={["em_separacao"]}
        orderId={14088}
        status="aguardando_envio"
      />,
    );

    const button = screen.getByRole("button", { name: /marcar como separado/i });
    await user.click(button);
    await user.click(button);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    pending[0](jsonResponse(200, {}));
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
  });

  it("explains a concurrent change when the backend answers 409", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(409, { message: "Transicao de status invalida." })),
    );
    const user = userEvent.setup();

    render(
      <VendorOrderStatusPanel
        hasShipments={false}
        nextStatuses={["em_separacao"]}
        orderId={14088}
        status="aguardando_envio"
      />,
    );

    await user.click(screen.getByRole("button", { name: /marcar como separado/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/transicao de status invalida/i);
    expect(alert).toHaveTextContent(/outra ação já moveu este pedido/i);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("requires a reason before cancelling", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <VendorOrderStatusPanel
        hasShipments={false}
        nextStatuses={["cancelado"]}
        orderId={14088}
        status="em_separacao"
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancelar pedido/i }));
    await user.click(screen.getByRole("button", { name: /confirmar cancelamento/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/informe o motivo/i);
  });

  it("mostra o erro dentro do modal quando o cancelamento é recusado (regressão)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(409, { message: "Transicao de status invalida." }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <VendorOrderStatusPanel
        hasShipments={false}
        nextStatuses={["cancelado"]}
        orderId={14088}
        status="em_separacao"
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancelar pedido/i }));
    await user.type(screen.getByLabelText(/justificativa/i), "Sem estoque no depósito.");
    await user.click(screen.getByRole("button", { name: /confirmar cancelamento/i }));

    // O modal segue aberto, e é dentro dele que a recusa precisa aparecer: o
    // banner do painel fica atrás do overlay e o vendor não o enxerga.
    expect(
      await within(screen.getByRole("dialog")).findByText(/transicao de status invalida/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("mostra a justificativa registrada no cancelamento", () => {
    render(
      <VendorOrderStatusPanel
        cancelReason="Sem estoque no depósito."
        hasShipments={false}
        nextStatuses={[]}
        orderId={14088}
        status="cancelado"
      />,
    );

    expect(screen.getByText("Sem estoque no depósito.")).toBeInTheDocument();
  });

  it("warns that a pre-posted order needs support to cancel", () => {
    render(
      <VendorOrderStatusPanel
        hasShipments
        nextStatuses={["cancelado"]}
        orderId={14088}
        status="em_separacao"
      />,
    );

    expect(screen.getByText(/precisa passar pelo suporte/i)).toBeInTheDocument();
  });
});
