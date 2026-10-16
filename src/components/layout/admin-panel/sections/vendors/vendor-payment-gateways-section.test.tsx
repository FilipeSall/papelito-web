import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GatewayStatus, VendorPaymentSummary } from "@/features/vendor-payment-gateways/types/payment-gateways";

import { VendorMercadoPagoIdentityForm } from "./vendor-mercadopago-identity-form";
import { VendorPaymentGatewaysSection } from "./vendor-payment-gateways-section";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

const IDENTITY_URL = "/api/admin/vendors/42/mercadopago-identity";
const SUBMIT_LABEL = "Registrar conferência";
const EVIDENCE_LABEL = /Referência da evidência/;

function gateway(overrides: Partial<GatewayStatus> = {}): GatewayStatus {
  return {
    provider: "mercadopago",
    state: "verification_pending",
    connectionStatus: "connected",
    kycStatus: "",
    restrictionCode: "",
    healthStatus: "ok",
    canReceive: false,
    reasonCodes: ["identity_verification_pending"],
    pendingFields: [],
    cnaeCodes: [],
    lastCheckedAt: "",
    lastSuccessAt: "",
    configurationVersion: "1",
    ...overrides,
  };
}

const SUMMARY: VendorPaymentSummary = {
  mode: "gateways",
  gateways: [
    gateway(),
    gateway({
      provider: "pagarme",
      state: "blocked_cnae",
      reasonCodes: ["cnae_restricted"],
      cnaeCodes: [{ code: "4729601", position: "primary", label: "Comércio varejista de produtos do fumo" }],
    }),
  ],
  preference: { preferredProvider: "mercadopago", version: 1, explicit: false },
  mercadopagoAccount: { accountId: 9, collectorId: "998877", identityStatus: "pending", status: "active", tokenExpiresAt: "", connectedAt: "" },
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  refreshMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("VendorPaymentGatewaysSection", () => {
  it("mostra os dois gateways e a conta Mercado Pago sem cara de aprovado", () => {
    render(<VendorPaymentGatewaysSection summary={SUMMARY} vendorId={42} />);

    const mercadopago = screen.getByRole("article", { name: "Mercado Pago" });
    expect(within(mercadopago).getByText("Em verificação pela Papelito")).toBeInTheDocument();
    expect(within(mercadopago).getByText("998877")).toBeInTheDocument();
    expect(within(mercadopago).getByText("Aguardando conferência")).toBeInTheDocument();
    expect(within(mercadopago).queryByText(/aprovad|pronto para receber/i)).not.toBeInTheDocument();

    const pagarme = screen.getByRole("article", { name: "Pagar.me" });
    expect(within(pagarme).getAllByText("Pagar.me indisponível para este CNAE").length).toBeGreaterThan(0);
    expect(within(pagarme).getByText(/4729-6\/01/)).toBeInTheDocument();
  });

  it("diz quando não conseguiu ler os gateways", () => {
    render(<VendorPaymentGatewaysSection summary={null} vendorId={42} />);

    expect(screen.getByText(/Não foi possível ler o estado dos gateways/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: SUBMIT_LABEL })).not.toBeInTheDocument();
  });
});

describe("VendorMercadoPagoIdentityForm", () => {
  it("exige a referência da evidência antes de qualquer envio", async () => {
    const user = userEvent.setup();
    render(<VendorMercadoPagoIdentityForm accountId={9} vendorId={42} />);

    await user.click(screen.getByRole("radio", { name: /Conta é do CNPJ da loja/ }));
    await user.click(screen.getByRole("button", { name: SUBMIT_LABEL }));

    expect(screen.getByText(/Informe a referência da evidência/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("exige escolher o resultado", async () => {
    const user = userEvent.setup();
    render(<VendorMercadoPagoIdentityForm accountId={9} vendorId={42} />);

    await user.type(screen.getByLabelText(EVIDENCE_LABEL), "CH-1234");
    await user.click(screen.getByRole("button", { name: SUBMIT_LABEL }));

    expect(screen.getByText(/Escolha o resultado da conferência/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirma antes de enviar e registra com a evidência", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(SUMMARY) }),
    );
    render(<VendorMercadoPagoIdentityForm accountId={9} vendorId={42} />);

    await user.click(screen.getByRole("radio", { name: /Conta de outro titular/ }));
    await user.type(screen.getByLabelText(EVIDENCE_LABEL), "  CH-1234 ");
    await user.click(screen.getByRole("button", { name: SUBMIT_LABEL }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/CH-1234/);
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Confirmar registro" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        IDENTITY_URL,
        expect.objectContaining({ method: "POST", body: JSON.stringify({ status: "mismatch", evidenceRef: "CH-1234", accountId: 9 }) }),
      ),
    );
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(await screen.findByRole("status")).toHaveTextContent(/Conferência registrada/);
  });

  it("mostra o erro do servidor e não atualiza a página", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: false, status: 422, json: () => Promise.resolve({ code: "x", message: "Evidência inválida." }) }),
    );
    render(<VendorMercadoPagoIdentityForm accountId={9} vendorId={42} />);

    await user.click(screen.getByRole("radio", { name: /Conta é do CNPJ da loja/ }));
    await user.type(screen.getByLabelText(EVIDENCE_LABEL), "CH-1");
    await user.click(screen.getByRole("button", { name: SUBMIT_LABEL }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar registro" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
