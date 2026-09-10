import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "../../../../test/msw/server";

import { OrderReturnRequest } from "./order-return-request";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const eligibility = {
  canRequest: true,
  items: [],
  message: "",
  reason: "",
  windowDays: 7,
  windowEndsAt: "2026-09-12 23:59:59",
};

function renderRequest() {
  return render(<OrderReturnRequest orderId="14094" returns={eligibility} />);
}

describe("OrderReturnRequest", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
  });

  it("não cria o chamado no clique: primeiro pede o motivo", async () => {
    const requests: string[] = [];
    server.events.on("request:start", ({ request }) => requests.push(request.url));

    const user = userEvent.setup();
    renderRequest();

    await user.click(screen.getByRole("button", { name: "Solicitar devolução" }));

    expect(await screen.findByText("Por que você quer devolver?")).toBeInTheDocument();
    expect(requests.some((url) => url.includes("/api/messages/return-support"))).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });

  it("avisa que está carregando os motivos, e só libera depois", async () => {
    let liberar: (value: unknown) => void = () => undefined;
    server.use(
      http.get("/api/messages/chamado-reasons", async () => {
        await new Promise((resolve) => {
          liberar = resolve;
        });
        return HttpResponse.json({
          reasons: [],
          return_reasons: [{ label: "Produto com defeito", requires_detail: false, value: "defective" }],
        });
      }),
    );

    const user = userEvent.setup();
    renderRequest();

    await user.click(screen.getByRole("button", { name: "Solicitar devolução" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Carregando motivos…");
    expect(screen.getByRole("button", { name: "Abrir chamado" })).toBeDisabled();

    liberar(null);

    expect(await screen.findByRole("radio", { name: "Produto com defeito" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("mantém a confirmação bloqueada enquanto não houver motivo", async () => {
    const user = userEvent.setup();
    renderRequest();

    await user.click(screen.getByRole("button", { name: "Solicitar devolução" }));
    await screen.findByText("Por que você quer devolver?");

    expect(screen.getByRole("button", { name: "Abrir chamado" })).toBeDisabled();
  });

  it("com o motivo escolhido, cria o chamado e leva para ele", async () => {
    let sent: Record<string, unknown> | null = null;
    server.use(
      http.post("/api/messages/return-support", async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ thread_id: 77 }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderRequest();

    await user.click(screen.getByRole("button", { name: "Solicitar devolução" }));
    await user.click(await screen.findByRole("radio", { name: "Produto com defeito" }));
    await user.click(screen.getByRole("button", { name: "Abrir chamado" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/perfil/chamados/77"));
    expect(sent).toEqual({ orderId: 14094, reason: "defective", reasonOther: "" });
  });

  it("exige a descrição quando o motivo é aberto", async () => {
    const user = userEvent.setup();
    renderRequest();

    await user.click(screen.getByRole("button", { name: "Solicitar devolução" }));
    await user.click(await screen.findByRole("radio", { name: "Outro motivo" }));

    expect(screen.getByRole("button", { name: "Abrir chamado" })).toBeDisabled();

    await user.type(screen.getByLabelText("Descreva o motivo *"), "A caixa chegou aberta");

    expect(screen.getByRole("button", { name: "Abrir chamado" })).toBeEnabled();
  });

  it("mostra a recusa do backend sem sair do modal", async () => {
    server.use(
      http.post("/api/messages/return-support", () =>
        HttpResponse.json({ message: "Prazo de devolução encerrado." }, { status: 409 }),
      ),
    );

    const user = userEvent.setup();
    renderRequest();

    await user.click(screen.getByRole("button", { name: "Solicitar devolução" }));
    await user.click(await screen.findByRole("radio", { name: "Desistência da compra" }));
    await user.click(screen.getByRole("button", { name: "Abrir chamado" }));

    expect(await screen.findByText("⚠ Prazo de devolução encerrado.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
