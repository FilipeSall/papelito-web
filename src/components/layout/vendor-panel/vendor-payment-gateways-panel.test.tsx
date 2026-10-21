import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  GatewayState,
  GatewayStatus,
  VendorPaymentSummary,
} from "@/features/vendor-payment-gateways/types/payment-gateways";
import { gatewayStateLabel } from "@/features/vendor-payment-gateways/utils/payment-gateway-messages";

import { VendorPaymentGatewaysPanel } from "./vendor-payment-gateways-panel";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

const PREFERENCES_URL = "/api/vendor/payment-preferences";
const MP_HEADING = "Mercado Pago";
const PAGARME_HEADING = "Pagar.me";
const BLOCKED_CNAE_TEXT = "Pagar.me indisponível para este CNAE";

function gateway(overrides: Partial<GatewayStatus> = {}): GatewayStatus {
  return {
    provider: "mercadopago",
    state: "ready",
    connectionStatus: "connected",
    kycStatus: "",
    restrictionCode: "",
    healthStatus: "ok",
    canReceive: true,
    reasonCodes: [],
    pendingFields: [],
    cnaeCodes: [],
    lastCheckedAt: "2026-10-16T13:30:00Z",
    lastSuccessAt: "",
    configurationVersion: "1",
    ...overrides,
  };
}

function summary(overrides: Partial<VendorPaymentSummary> = {}): VendorPaymentSummary {
  return {
    mode: "gateways",
    gateways: [gateway(), gateway({ provider: "pagarme" })],
    preference: { preferredProvider: "mercadopago", version: 3, explicit: true },
    mercadopagoAccount: {
      accountId: 5,
      collectorId: "123456",
      identityStatus: "verified",
      status: "active",
      tokenExpiresAt: "",
      connectedAt: "",
    },
    ...overrides,
  };
}

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(data) });
}

function card(name: string) {
  return screen.getByRole("group", { name });
}

function radio(name: string) {
  return screen.getByRole("radio", { name: new RegExp(name) });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  refreshMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("VendorPaymentGatewaysPanel — linhas dos gateways", () => {
  const STATES: GatewayState[] = [
    "unconfigured",
    "connection_pending",
    "verification_pending",
    "kyc_pending",
    "ready",
    "degraded",
    "unavailable",
  ];

  it.each(STATES)("mostra o rótulo do estado %s na linha do Mercado Pago", (state) => {
    const canReceive = state === "ready" || state === "degraded";
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({ gateways: [gateway({ state, canReceive }), gateway({ provider: "pagarme" })] })}
      />,
    );

    expect(within(card(MP_HEADING)).getByText(gatewayStateLabel(state))).toBeInTheDocument();
  });

  it("Mercado Pago em verificação não tem cara de aprovado", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({
          gateways: [
            gateway({ state: "verification_pending", canReceive: false, reasonCodes: ["identity_verification_pending"] }),
            gateway({ provider: "pagarme" }),
          ],
          mercadopagoAccount: { accountId: 1, collectorId: "1", identityStatus: "pending", status: "active", tokenExpiresAt: "", connectedAt: "" },
        })}
      />,
    );

    const mercadopago = card(MP_HEADING);
    expect(within(mercadopago).queryByText(/pronto para receber|aprovad/i)).not.toBeInTheDocument();
    expect(within(mercadopago).getByText("Não recebe")).toBeInTheDocument();
    expect(within(mercadopago).getByText(/conferindo se a conta conectada pertence ao CNPJ/)).toBeInTheDocument();
  });

  it("Pagar.me bloqueada mostra o texto fixo e os CNAEs com a posição", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({
          gateways: [
            gateway(),
            gateway({
              provider: "pagarme",
              state: "blocked_cnae",
              canReceive: false,
              reasonCodes: ["cnae_restricted"],
              cnaeCodes: [
                { code: "4729601", position: "primary", label: "Comércio varejista de produtos do fumo" },
                { code: "4636202", position: "secondary", label: "Comércio atacadista de cigarros" },
              ],
            }),
          ],
        })}
      />,
    );

    const pagarme = card(PAGARME_HEADING);
    expect(within(pagarme).getAllByText(BLOCKED_CNAE_TEXT).length).toBeGreaterThan(0);
    expect(within(pagarme).getByText(/4729-6\/01/)).toBeInTheDocument();
    expect(within(pagarme).getByText(/CNAE principal/)).toBeInTheDocument();
    expect(within(pagarme).getByText(/4636-2\/02/)).toBeInTheDocument();
    expect(within(pagarme).getByText(/CNAE secundário/)).toBeInTheDocument();
  });

  it("motivos e pendências aparecem legíveis, nunca como código", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({
          gateways: [
            gateway(),
            gateway({
              provider: "pagarme",
              state: "unconfigured",
              canReceive: false,
              reasonCodes: ["never_synced", "motivo_interno_xyz"],
              pendingFields: ["partner.document", "bankAccount.accountNumber"],
            }),
          ],
        })}
      />,
    );

    const pagarme = card(PAGARME_HEADING);
    expect(within(pagarme).getByText(/Complete os dados financeiros/)).toBeInTheDocument();
    expect(within(pagarme).queryByText(/motivo_interno_xyz|never_synced|partner\.document/)).not.toBeInTheDocument();
    expect(within(pagarme).getByText(/CPF do socio administrador/)).toBeInTheDocument();
  });

  it("mostra última verificação e diz quando nunca houve sucesso", () => {
    render(<VendorPaymentGatewaysPanel initialSummary={summary()} />);

    const mercadopago = card(MP_HEADING);
    expect(within(mercadopago).getByText(/16\/10\/2026/)).toBeInTheDocument();
    expect(within(mercadopago).getByText("Nunca")).toBeInTheDocument();
  });
});

describe("VendorPaymentGatewaysPanel — escolha exclusiva", () => {
  it("deixa desabilitado o rádio do gateway inapto", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({
          gateways: [gateway(), gateway({ provider: "pagarme", state: "blocked_cnae", canReceive: false })],
        })}
      />,
    );

    expect(radio(PAGARME_HEADING)).toBeDisabled();
    expect(radio(MP_HEADING)).toBeEnabled();
  });

  it("escolha salva que ficou inapta continua marcada, com o motivo e o alerta de loja fora do checkout", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({
          gateways: [
            gateway({ state: "connection_pending", canReceive: false, reasonCodes: ["reauthorization_required"] }),
            gateway({ provider: "pagarme" }),
          ],
        })}
      />,
    );

    expect(radio(MP_HEADING)).toBeChecked();
    expect(within(card(MP_HEADING)).getByText("Escolhido, mas não recebe")).toBeInTheDocument();
    expect(within(card(MP_HEADING)).getAllByText(/autorização do Mercado Pago expirou/).length).toBeGreaterThan(0);
    expect(screen.getByRole("alert")).toHaveTextContent(/fora do checkout/);
  });

  it("salva com a versão e só marca depois da confirmação do servidor", async () => {
    const user = userEvent.setup();
    let resolveSave: (value: unknown) => void = () => undefined;
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    render(<VendorPaymentGatewaysPanel initialSummary={summary()} />);

    await user.click(radio(PAGARME_HEADING));

    expect(fetchMock).toHaveBeenCalledWith(
      PREFERENCES_URL,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ preferredProvider: "pagarme", configurationVersion: 3 }),
      }),
    );
    expect(radio(MP_HEADING)).toBeChecked();

    resolveSave({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ preference: { preferredProvider: "pagarme", version: 4, explicit: true } }),
    });

    await waitFor(() => expect(radio(PAGARME_HEADING)).toBeChecked());
    expect(screen.getByRole("status")).toHaveTextContent(/Pagar\.me passa a receber todos os novos pedidos/);
    expect(within(card(MP_HEADING)).getByText("Fora do checkout")).toBeInTheDocument();
  });

  it("falha ao salvar não muda o rádio", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() => jsonResponse({ code: "papelito_payment_gateway_not_eligible" }, 422));
    render(<VendorPaymentGatewaysPanel initialSummary={summary()} />);

    await user.click(radio(PAGARME_HEADING));

    expect(await screen.findByText(/ainda não pode receber pagamentos/)).toBeInTheDocument();
    expect(radio(MP_HEADING)).toBeChecked();
    expect(radio(PAGARME_HEADING)).not.toBeChecked();
  });

  it("conflito de versão pede para atualizar a página", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() => jsonResponse({ code: "papelito_payment_preference_version_conflict" }, 409));
    render(<VendorPaymentGatewaysPanel initialSummary={summary()} />);

    await user.click(radio(PAGARME_HEADING));

    expect(await screen.findByText(/Atualize a página/)).toBeInTheDocument();
    expect(radio(MP_HEADING)).toBeChecked();
  });

  it("conferência da Papelito não manda a loja resolver nada nem trocar para gateway bloqueado", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({
          gateways: [
            gateway({ state: "verification_pending", canReceive: false, reasonCodes: ["identity_verification_pending"] }),
            gateway({ provider: "pagarme", state: "blocked_cnae", canReceive: false, reasonCodes: ["cnae_restricted"] }),
          ],
        })}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/assim que a Papelito concluir a conferência/i);
    expect(alert).not.toHaveTextContent(/resolva a pendência/i);
    expect(alert).not.toHaveTextContent(/escolha o outro gateway/i);
  });

  it("pendência da loja pede para resolver e só sugere o outro gateway quando ele está apto", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({
          gateways: [
            gateway({ state: "connection_pending", canReceive: false, reasonCodes: ["reauthorization_required"] }),
            gateway({ provider: "pagarme", state: "blocked_cnae", canReceive: false, reasonCodes: ["cnae_restricted"] }),
          ],
        })}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/resolva a pendência/i);
    expect(alert).not.toHaveTextContent(/escolha o outro gateway/i);
  });

  it("explica que só um gateway recebe e que pedido emitido não troca", () => {
    render(<VendorPaymentGatewaysPanel initialSummary={summary()} />);

    expect(screen.getByText(/Só um gateway recebe por vez/i)).toBeInTheDocument();
    expect(screen.getByText(/não troca de gateway/i)).toBeInTheDocument();
    expect(within(card(MP_HEADING)).getByText("Recebe os pedidos")).toBeInTheDocument();
    expect(within(card(PAGARME_HEADING)).getByText("Fora do checkout")).toBeInTheDocument();
  });

  it("modo suspenso trava a escolha", () => {
    render(<VendorPaymentGatewaysPanel initialSummary={summary({ mode: "suspended" })} />);

    expect(radio(MP_HEADING)).toBeDisabled();
    expect(radio(PAGARME_HEADING)).toBeDisabled();
  });
});

describe("VendorPaymentGatewaysPanel — habilitação da Pagar.me", () => {
  const PAGARME_PENDING_SUBMIT = gateway({ provider: "pagarme", state: "unconfigured", canReceive: false, reasonCodes: ["not_connected"], pendingFields: [] });

  it("cadastro completo sem recebedor envia os dados à Pagar.me e relê o estado", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation((url: string) =>
      url === "/api/vendor/recipient" ? jsonResponse({ recipient_id: "re_1", status: "registration" }) : jsonResponse(summary()),
    );
    render(<VendorPaymentGatewaysPanel initialSummary={summary({ gateways: [gateway(), PAGARME_PENDING_SUBMIT] })} />);

    await user.click(within(card(PAGARME_HEADING)).getByRole("button", { name: "Enviar cadastro à Pagar.me" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/vendor/recipient", expect.objectContaining({ method: "POST" })));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/vendor/payment-gateways", expect.objectContaining({ method: "GET" })));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("cadastro com pendência leva ao formulário em vez de enviar", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({ gateways: [gateway(), { ...PAGARME_PENDING_SUBMIT, pendingFields: ["partner.document"] }] })}
      />,
    );

    expect(within(card(PAGARME_HEADING)).getByRole("link", { name: "Completar dados financeiros" })).toBeInTheDocument();
    expect(within(card(PAGARME_HEADING)).queryByRole("button", { name: "Enviar cadastro à Pagar.me" })).not.toBeInTheDocument();
  });

  it("recebedor em análise oferece concluir a verificação na Pagar.me", async () => {
    const user = userEvent.setup();
    const assignMock = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, assign: assignMock } });
    fetchMock.mockImplementation(() => jsonResponse({ url: "https://kyc.pagar.me/link-1" }));
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({
          gateways: [gateway(), gateway({ provider: "pagarme", state: "kyc_pending", canReceive: false, kycStatus: "pending", reasonCodes: ["in_review"] })],
        })}
      />,
    );

    await user.click(within(card(PAGARME_HEADING)).getByRole("button", { name: "Concluir verificação na Pagar.me" }));

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith("https://kyc.pagar.me/link-1"));
    expect(fetchMock).toHaveBeenCalledWith("/api/vendor/recipient/kyc-link", expect.objectContaining({ method: "POST" }));
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("Pagar.me bloqueada por CNAE não oferece envio nem verificação", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({ gateways: [gateway(), gateway({ provider: "pagarme", state: "blocked_cnae", canReceive: false })] })}
      />,
    );

    expect(within(card(PAGARME_HEADING)).queryByRole("button", { name: /Enviar cadastro|Concluir verificação/ })).not.toBeInTheDocument();
  });
});

describe("VendorPaymentGatewaysPanel — ações", () => {
  it("mostra o banner do retorno do OAuth", () => {
    render(<VendorPaymentGatewaysPanel initialSummary={summary()} oauthOutcome="connected" />);

    expect(screen.getByRole("status")).toHaveTextContent("Conta Mercado Pago conectada");
  });

  it("traduz o erro do retorno do OAuth pelo catálogo", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary()}
        oauthOutcome="error"
        oauthReason="papelito_payment_account_collector_in_use"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/já está vinculada a outra loja/);
  });

  it("atualizar estado trata o limite de tentativas", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() => jsonResponse({}, 429));
    render(<VendorPaymentGatewaysPanel initialSummary={summary()} />);

    await user.click(screen.getByRole("button", { name: "Atualizar estado" }));

    expect(await screen.findByText(/Muitas tentativas/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/vendor/payment-gateways/refresh", expect.objectContaining({ method: "POST" }));
  });

  it("conta conectada e recebendo não oferece reconectar, só desconectar", () => {
    render(<VendorPaymentGatewaysPanel initialSummary={summary()} />);

    const mercadopago = card(MP_HEADING);
    expect(within(mercadopago).queryByRole("button", { name: /reconectar mercado pago/i })).not.toBeInTheDocument();
    expect(within(mercadopago).getByRole("button", { name: "Desconectar" })).toBeInTheDocument();
  });

  it("conta conectada que precisa de nova autorização oferece reconectar", () => {
    render(
      <VendorPaymentGatewaysPanel
        initialSummary={summary({
          gateways: [
            gateway({ state: "connection_pending", canReceive: false, reasonCodes: ["reauthorization_required"] }),
            gateway({ provider: "pagarme" }),
          ],
        })}
      />,
    );

    expect(within(card(MP_HEADING)).getByRole("button", { name: /reconectar mercado pago/i })).toBeInTheDocument();
  });

  it("conectar leva para a URL de autorização devolvida pelo servidor", async () => {
    const user = userEvent.setup();
    const assignMock = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, assign: assignMock } });
    fetchMock.mockImplementation(() => jsonResponse({ authorizationUrl: "https://auth.mercadopago.com.br/authorization?x=1" }));
    render(<VendorPaymentGatewaysPanel initialSummary={summary({ mercadopagoAccount: null })} />);

    await user.click(screen.getByRole("button", { name: "Conectar Mercado Pago" }));

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith("https://auth.mercadopago.com.br/authorization?x=1"));
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("desconectar pede a senha atual e avisa sobre cobranças anteriores", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation((url: string) =>
      url === "/api/vendor/mercadopago/disconnect" ? jsonResponse({ disconnected: true }) : jsonResponse(summary({ mercadopagoAccount: null })),
    );
    render(<VendorPaymentGatewaysPanel initialSummary={summary()} />);

    await user.click(screen.getByRole("button", { name: "Desconectar" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/cobranças anteriores continuam ligadas à conta antiga/i);
    expect(dialog).toHaveTextContent(/estornos podem exigir reconexão/i);

    await user.type(within(dialog).getByLabelText(/Senha da sua conta Papelito/), "minha-senha");
    await user.click(within(dialog).getByRole("button", { name: "Desconectar conta" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/vendor/mercadopago/disconnect",
        expect.objectContaining({ method: "POST", body: JSON.stringify({ currentPassword: "minha-senha" }) }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(refreshMock).toHaveBeenCalled();
  });

  it("senha errada mantém o diálogo aberto com a mensagem", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() => jsonResponse({ code: "papelito_reauthentication_failed" }, 403));
    render(<VendorPaymentGatewaysPanel initialSummary={summary()} />);

    await user.click(screen.getByRole("button", { name: "Desconectar" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/Senha da sua conta Papelito/), "errada");
    await user.click(within(dialog).getByRole("button", { name: "Desconectar conta" }));

    expect(await within(dialog).findByText(/Não foi possível confirmar a senha atual/)).toBeInTheDocument();
  });
});
