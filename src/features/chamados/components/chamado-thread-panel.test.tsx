import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mapChamado } from "../services/chamado-mappers";
import {
  CHAMADO_CLOSE_ALLOWED_ID,
  CHAMADO_CLOSE_FORBIDDEN_ID,
  CHAMADO_COM_DEVOLUCAO_ID,
  CHAMADO_ENCERRADO_ID,
  CHAMADO_ESTORNO_CONCLUIDO_ID,
  CHAMADO_INICIAR_DEVOLUCAO_ID,
  CHAMADO_SEM_WHATSAPP_ID,
  CHAMADO_VISTA_VENDOR_ID,
  wpChamado,
} from "../../../../test/factories/chamado";
import type { ChamadoRole } from "../types/chamado";

import { ChamadoThreadPanel } from "./chamado-thread-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function renderPanel(overrides: Record<string, unknown> = {}) {
  return render(
    <ChamadoThreadPanel initialChamado={mapChamado(wpChamado(overrides))} />,
  );
}

/** O compositor é `contentEditable`: escrever nele é mexer no DOM e avisar o React. */
function write(text: string) {
  const composer = screen.getByRole("textbox", { name: "Mensagem" });
  composer.textContent = text;
  fireEvent.input(composer);
  return composer;
}

describe("ChamadoThreadPanel", () => {
  it.each<ChamadoRole>(["customer", "seller", "administrator"])(
    "deixa %s responder num chamado aberto",
    async (viewerRole) => {
      const user = userEvent.setup();
      renderPanel({ viewer_role: viewerRole });

      write("Resposta do atendimento");
      await user.click(screen.getByRole("button", { name: "Enviar" }));

      await waitFor(() =>
        expect(screen.getByText("Resposta do atendimento")).toBeInTheDocument(),
      );
    },
  );

  it("não mostra o compositor num chamado encerrado, e explica o que fazer", () => {
    renderPanel({
      capabilities: { can_close: false, can_escalate: false, can_reply: false },
      closed_at: "2026-09-05 08:00:00",
      closed_by_name: "Papeloto",
      status: "ENCERRADO",
      thread_id: CHAMADO_ENCERRADO_ID,
    });

    expect(
      screen.queryByRole("textbox", { name: "Mensagem" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Encerrado")).toBeInTheDocument();
    expect(screen.getByText(/Abra um novo chamado no/)).toBeInTheDocument();
  });

  it("não oferece encerramento a quem o backend não autoriza", () => {
    renderPanel({
      capabilities: { can_close: false, can_escalate: true, can_reply: true },
    });

    expect(
      screen.queryByRole("button", { name: /Encerrar chamado/ }),
    ).not.toBeInTheDocument();
  });

  it("Enter quebra linha e não envia: só o botão envia", async () => {
    renderPanel();
    const composer = write("Rascunho");

    fireEvent.keyDown(composer, { key: "Enter" });
    await new Promise((resolve) => setTimeout(resolve, 50));

    // O rascunho continua no compositor, e nada foi para a conversa.
    expect(composer.textContent).toBe("Rascunho");
    expect(screen.queryByText("Rascunho")).toBe(composer);
  });

  it("vendor relacionado encerra e o chamado passa a recusar mensagens", async () => {
    const user = userEvent.setup();
    renderPanel({
      capabilities: { can_close: true, can_escalate: false, can_reply: true },
      thread_id: CHAMADO_CLOSE_ALLOWED_ID,
      viewer_role: "seller",
    });

    await user.click(screen.getByRole("button", { name: /Encerrar chamado/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Encerrar chamado" }),
    );

    await waitFor(() =>
      expect(screen.getByText("Encerrado")).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("textbox", { name: "Mensagem" }),
    ).not.toBeInTheDocument();
  });

  it("recusa do backend ao encerrar aparece como erro, sem fingir sucesso", async () => {
    const user = userEvent.setup();
    renderPanel({
      capabilities: { can_close: true, can_escalate: false, can_reply: true },
      thread_id: CHAMADO_CLOSE_FORBIDDEN_ID,
      viewer_role: "seller",
    });

    await user.click(screen.getByRole("button", { name: /Encerrar chamado/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Encerrar chamado" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "⚠ Somente a loja ou a Papelito podem encerrar o chamado.",
        ),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Encerrado")).not.toBeInTheDocument();
  });

  it("mostra o andamento da devolução dentro do chamado, sem mandar procurar em outra área", async () => {
    renderPanel({
      reason: "devolucao",
      reason_label: "Solicitação de devolução",
      return_request: { id: 55, status: "awaiting_reverse_authorization" },
      thread_id: CHAMADO_COM_DEVOLUCAO_ID,
    });

    await waitFor(() =>
      expect(screen.getByText("Devolução #55")).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: /Acompanhar/ })).toHaveAttribute(
      "href",
      "/perfil/devolucoes/55",
    );
  });

  it("sem devolução formal, nada de faixa vazia", () => {
    renderPanel();

    expect(screen.queryByText(/Devolução #/)).not.toBeInTheDocument();
  });

  it("oferece iniciar devolução somente à loja responsável pelo chamado", () => {
    renderPanel({
      capabilities: {
        can_close: true,
        can_escalate: false,
        can_reply: true,
        can_start_return: true,
      },
      reason: "devolucao",
      return_reason: "defective",
      thread_id: CHAMADO_INICIAR_DEVOLUCAO_ID,
      viewer_role: "seller",
    });

    expect(
      screen.getByRole("button", { name: "Iniciar devolução" }),
    ).toBeInTheDocument();
  });

  it("nomeia o acompanhamento de estorno para o cliente depois da conclusão", async () => {
    renderPanel({
      reason: "devolucao",
      return_request: { id: 55, status: "refunded" },
      thread_id: CHAMADO_ESTORNO_CONCLUIDO_ID,
    });

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Acompanhar estorno" }),
      ).toHaveAttribute("href", "/perfil/devolucoes/55"),
    );
  });

  it("oferece o WhatsApp da loja ao comprador, com o número cadastrado", () => {
    renderPanel();

    const link = screen.getByRole("link", {
      name: /Falar com Papeloto no WhatsApp/,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://wa.me/5561999733064?text=Ol%C3%A1%21",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("loja sem telefone não vira link quebrado", async () => {
    renderPanel({
      participants: {
        customer: { id: 17, name: "Ana Compradora" },
        seller: { id: 29, name: "Papeloto", whatsapp_url: null },
      },
      thread_id: CHAMADO_SEM_WHATSAPP_ID,
    });

    await waitFor(() =>
      expect(
        screen.getByText("Loja sem WhatsApp cadastrado"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("link", { name: /WhatsApp/ }),
    ).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("wa.me");
  });

  it("não oferece WhatsApp ao próprio vendor", async () => {
    renderPanel({
      participants: {
        customer: { id: 17, name: "Ana Compradora" },
        seller: { id: 29, name: "Papeloto" },
      },
      thread_id: CHAMADO_VISTA_VENDOR_ID,
      viewer_role: "seller",
    });

    await waitFor(() => expect(screen.getByText("Aberto")).toBeInTheDocument());
    expect(screen.queryByText(/WhatsApp/)).not.toBeInTheDocument();
  });
});
