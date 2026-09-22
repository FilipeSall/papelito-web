import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminVendorIntegration } from "@/lib/server/admin-vendor-integrations";

import { BraspressIntegrationCard } from "./braspress-integration-card";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const VENDOR_ID = 2334;
const VENDOR_NAME = "Cifal Comercial de Tabacos";
const ENDPOINT = `/api/admin/vendors/${VENDOR_ID}/integrations/braspress`;
const BRASPRESS_USERNAME = "usuario-do-contrato";
const BRASPRESS_SECRET = "senha-do-contrato-da-loja";

function buildIntegration(overrides: Partial<AdminVendorIntegration> = {}): AdminVendorIntegration {
  return {
    provider: "braspress",
    label: "Braspress",
    kind: "carrier",
    enabled: true,
    status: "active",
    configurationVersion: 3,
    configured: true,
    credentialsConfigured: true,
    config: { senderCnpj: "20024291000165", originCep: "14700000" },
    loadFailed: false,
    ...overrides,
  };
}

function renderCard(overrides: Partial<AdminVendorIntegration> = {}) {
  return render(
    <BraspressIntegrationCard
      integration={buildIntegration(overrides)}
      vendorId={VENDOR_ID}
      vendorName={VENDOR_NAME}
    />,
  );
}

function stubFetch(status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ provider: "braspress" }), {
      headers: { "Content-Type": "application/json" },
      status,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("BraspressIntegrationCard", () => {
  it("oferece só o cadastro quando o vendor não tem integração", () => {
    renderCard({ credentialsConfigured: false, enabled: false, status: "unconfigured" });

    expect(screen.getByText("Não integrado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /adicionar integração/i })).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remover integração/i })).not.toBeInTheDocument();
  });

  it("diz que a credencial existe sem exibi-la", () => {
    const { container } = renderCard();

    expect(screen.getByText("Integrado · ativo")).toBeInTheDocument();
    expect(screen.getByText("Configuradas")).toBeInTheDocument();
    expect(screen.getByText("20.024.291/0001-65")).toBeInTheDocument();
    expect(screen.getByText("14700-000")).toBeInTheDocument();
    expect(container.innerHTML).not.toContain(BRASPRESS_SECRET);
    expect(container.innerHTML).not.toContain(BRASPRESS_USERNAME);
    expect(container.querySelector('input[type="password"]')).toBeNull();
  });

  it("marca como desativado o vendor com credencial e interruptor desligado", () => {
    renderCard({ enabled: false });

    expect(screen.getByText("Desativado")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("desliga a integração direto no toggle, sem confirmação", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();
    renderCard();

    await user.click(screen.getByRole("switch"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ enabled: false, originCep: "14700000" });
    expect(await screen.findByRole("status")).toHaveTextContent(/desligada para esta loja/i);
    expect(refresh).toHaveBeenCalled();
  });

  it("envia a credencial informada no modal, sem pedir senha de conta Papelito", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();
    renderCard({ credentialsConfigured: false, enabled: false, status: "unconfigured" });

    await user.click(screen.getByRole("button", { name: /adicionar integração/i }));

    expect(screen.queryByLabelText(/senha da sua conta/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/senha da conta papelito/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/cnpj remetente/i)).toBeDisabled();

    await user.type(screen.getByLabelText(/usuário braspress/i), BRASPRESS_USERNAME);
    await user.type(screen.getByLabelText(/senha braspress/i), BRASPRESS_SECRET);
    await user.click(screen.getByRole("button", { name: /salvar credencial/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
      enabled: false,
      originCep: "14700000",
      password: BRASPRESS_SECRET,
      username: BRASPRESS_USERNAME,
    });
  });

  it("não salva credencial pela metade", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();
    renderCard({ credentialsConfigured: false, enabled: false, status: "unconfigured" });

    await user.click(screen.getByRole("button", { name: /adicionar integração/i }));
    await user.type(screen.getByLabelText(/usuário braspress/i), BRASPRESS_USERNAME);

    expect(screen.getByRole("button", { name: /salvar credencial/i })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirma antes de remover a integração", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();
    renderCard();

    await user.click(screen.getByRole("button", { name: /remover integração/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/remover integração braspress/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirmar remoção/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]![1].method).toBe("DELETE");
  });

  it("mostra a recusa do backend sem mascarar o erro", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Informe o CEP de origem." }), {
          headers: { "Content-Type": "application/json" },
          status: 422,
        }),
      ),
    );
    renderCard({ enabled: false });

    await user.click(screen.getByRole("switch"));

    expect(await screen.findByRole("status")).toHaveTextContent("Informe o CEP de origem.");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("bloqueia as ações quando o estado não pôde ser lido", () => {
    renderCard({ loadFailed: true });

    expect(screen.getByText("Estado não lido")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByRole("button", { name: /alterar credencial/i })).toBeDisabled();
  });
});
